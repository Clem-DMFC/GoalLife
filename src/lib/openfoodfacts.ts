import type { MacroTotals } from './types'

/**
 * Recherche d'aliments dans Open Food Facts.
 * Base collaborative, gratuite, sans clé d'API, très fournie en produits
 * vendus en France. L'appel part directement du navigateur (CORS ouvert).
 *
 * Deux endpoints : l'API de recherche actuelle (Search-a-licious), et
 * l'ancienne `cgi/search.pl` en repli. Cette dernière est fortement limitée
 * pour les requêtes anonymes et renvoie souvent une page « service
 * indisponible » plutôt que du JSON — d'où l'ordre.
 */

const SEARCH_ENDPOINT = 'https://search.openfoodfacts.org/search'
const LEGACY_ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl'

/*
 * `product_name` est indexé en `text_lang` : le document porte la valeur
 * brute, une sous-clé par langue (`product_name_fr`), et `product_name_main`
 * pour la langue principale du produit — le meilleur repli quand la fiche
 * n'est pas traduite en français.
 */
const FIELDS =
  'code,product_name,product_name_fr,product_name_main,generic_name,brands,' +
  'serving_size,serving_quantity,nutriments'

/** Sans `langs`, l'API ne cherche que dans les sous-champs anglais. */
const LANGS = 'fr,en'

export type Food = {
  code: string
  name: string
  brand: string
  /** Macros pour 100 g. */
  per100: MacroTotals
  /** Poids d'une portion en grammes, quand le produit le renseigne. */
  servingGrams: number | null
}

type OffNutriments = Record<string, unknown>

type OffProduct = {
  code?: string
  product_name?: unknown
  product_name_fr?: unknown
  product_name_main?: unknown
  generic_name?: unknown
  brands?: unknown
  serving_quantity?: number | string
  serving_size?: string
  nutriments?: OffNutriments
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(',', '.'))
    if (Number.isFinite(n)) return n
  }
  return null
}

/** Certains produits n'ont que l'énergie en kJ : on retombe dessus. */
function kcalPer100(n: OffNutriments): number | null {
  const direct = num(n['energy-kcal_100g'])
  if (direct !== null) return direct
  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g'])
  return kj !== null ? kj / 4.184 : null
}

/** Le poids de portion est parfois dans serving_quantity, parfois "30 g". */
function servingGrams(p: OffProduct): number | null {
  const direct = num(p.serving_quantity)
  if (direct !== null && direct > 0) return direct
  const match = /([\d.,]+)\s*g/i.exec(p.serving_size ?? '')
  if (match) {
    const n = num(match[1])
    if (n !== null && n > 0) return n
  }
  return null
}

/**
 * Un champ traduit revient tantôt en chaîne, tantôt en objet langue → texte
 * selon l'endpoint. On prend la première valeur exploitable.
 */
function text(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (v && typeof v === 'object') {
    for (const key of ['fr', 'main', 'en']) {
      const inner = (v as Record<string, unknown>)[key]
      if (typeof inner === 'string' && inner.trim()) return inner.trim()
    }
  }
  return ''
}

function toFood(p: OffProduct): Food | null {
  const n = p.nutriments
  if (!n) return null

  const kcal = kcalPer100(n)
  // Sans calories, la ligne n'a aucune valeur pour du suivi : on l'écarte.
  if (kcal === null || kcal <= 0) return null

  const name =
    text(p.product_name_fr) ||
    text(p.product_name) ||
    text(p.product_name_main) ||
    text(p.generic_name)
  if (!name) return null

  return {
    code: String(p.code ?? name),
    name,
    brand: text(p.brands).split(',')[0]?.trim() ?? '',
    per100: {
      kcal,
      protein: num(n.proteins_100g) ?? 0,
      carbs: num(n.carbohydrates_100g) ?? 0,
      fat: num(n.fat_100g) ?? 0,
    },
    servingGrams: servingGrams(p),
  }
}

/** Erreur de recherche portant un message affichable tel quel. */
export class SearchError extends Error {}

/** Caractères réservés par Lucene, qu'un nom d'aliment ne contient jamais. */
const LUCENE_OPERATORS = /[+\-&|!(){}[\]^"~*?:\\/]+/g

/** Retire les diacritiques : « pôulet » et « poulet » deviennent identiques. */
export function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Nettoie la saisie avant de la confier au parseur Lucene de l'API.
 *
 * `q` est interprété comme une requête Lucene : un tiret dans
 * « saint-nectaire » devient un NOT, et une parenthèse ouverte seule fait
 * répondre 400. L'utilisateur tape un nom d'aliment, jamais une syntaxe de
 * requête — on retire donc purement les opérateurs.
 */
export function normalizeQuery(raw: string): string {
  return raw
    .replace(LUCENE_OPERATORS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Requête envoyée à l'API. La casse et les élisions sont déjà gérées par
 * l'analyseur français d'Elasticsearch, côté index comme côté requête.
 *
 * Les accents, eux, ne sont pas repliés par cet analyseur : retirer les
 * accents de la requête casserait « crème », qui est indexé accentué. On
 * envoie donc les deux formes en alternative quand elles diffèrent, ce qui
 * rattrape « pôulet » et « creme » sans rien perdre.
 */
export function buildQuery(term: string): string {
  const bare = deaccent(term)
  if (bare === term) return term
  return `(${term}) OR (${bare})`
}

/** Les deux endpoints ne nomment pas la liste pareil : `hits` vs `products`. */
async function fetchProducts(url: string, signal?: AbortSignal): Promise<OffProduct[]> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })

  if (res.status === 429) {
    throw new SearchError('Trop de recherches. Attends une minute et réessaie.')
  }
  if (!res.ok) {
    throw new SearchError(`Open Food Facts a répondu ${res.status}.`)
  }
  // Quand l'API sature, elle renvoie une page HTML « service indisponible »
  // avec un statut 200 : sans cette garde, le .json() lève une erreur opaque.
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('json')) {
    throw new SearchError('Open Food Facts est momentanément indisponible.')
  }

  const data = (await res.json()) as { hits?: OffProduct[]; products?: OffProduct[] } | null
  return data?.hits ?? data?.products ?? []
}

function toFoods(products: OffProduct[]): Food[] {
  const seen = new Set<string>()
  const foods: Food[] = []
  for (const p of products) {
    const food = toFood(p)
    if (!food) continue
    // Les doublons de code-barres sont fréquents dans la base.
    const key = `${food.name.toLowerCase()}|${food.brand.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    foods.push(food)
  }
  return foods
}

/** Résultat d'un endpoint : soit des aliments, soit le motif de l'échec. */
type Attempt = { foods: Food[]; error: SearchError | null }

async function attempt(url: string, signal?: AbortSignal): Promise<Attempt> {
  try {
    return { foods: toFoods(await fetchProducts(url, signal)), error: null }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    return {
      foods: [],
      error:
        err instanceof SearchError
          ? err
          : new SearchError('Recherche injoignable. Vérifie ta connexion.'),
    }
  }
}

/**
 * Cherche un aliment. Ne lève que si les deux endpoints ont échoué **et**
 * qu'aucun résultat n'a été obtenu : une API en repli qui répond ne doit
 * jamais faire clignoter une erreur.
 */
export async function searchFoods(query: string, signal?: AbortSignal): Promise<Food[]> {
  const term = normalizeQuery(query)
  if (term.length < 2) return []

  const q = encodeURIComponent(buildQuery(term))
  const primary =
    `${SEARCH_ENDPOINT}?q=${q}&langs=${LANGS}&page_size=25` +
    `&boost_phrase=true&fields=${FIELDS}`

  const first = await attempt(primary, signal)
  if (first.foods.length > 0) return first.foods

  // Repli aussi quand la nouvelle API répond sans rien connaître du terme :
  // l'ancienne base retrouve encore beaucoup de produits frais.
  const legacy =
    `${LEGACY_ENDPOINT}?search_terms=${encodeURIComponent(term)}` +
    `&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`
  const second = await attempt(legacy, signal)
  if (second.foods.length > 0) return second.foods

  // Aucun résultat nulle part : on ne signale une erreur que s'il y en a eu
  // une. Sans cela, « aucun résultat » se déguisait en panne.
  if (first.error) throw first.error
  if (second.error) throw second.error
  return []
}

/** Macros d'une quantité donnée, arrondies à l'entier comme le reste de l'app. */
export function scaleToGrams(per100: MacroTotals, grams: number): MacroTotals {
  const k = grams / 100
  return {
    kcal: Math.round(per100.kcal * k),
    protein: Math.round(per100.protein * k),
    carbs: Math.round(per100.carbs * k),
    fat: Math.round(per100.fat * k),
  }
}
