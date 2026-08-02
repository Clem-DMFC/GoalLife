import type { MacroTotals } from './types'

/**
 * Recherche d'aliments dans Open Food Facts.
 * Base collaborative, gratuite, sans clé d'API, très fournie en produits
 * vendus en France. L'appel part directement du navigateur (CORS ouvert).
 */

const ENDPOINT = 'https://fr.openfoodfacts.org/cgi/search.pl'

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
  product_name?: string
  product_name_fr?: string
  generic_name?: string
  brands?: string
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

function toFood(p: OffProduct): Food | null {
  const n = p.nutriments
  if (!n) return null

  const kcal = kcalPer100(n)
  // Sans calories, la ligne n'a aucune valeur pour du suivi : on l'écarte.
  if (kcal === null || kcal <= 0) return null

  const name = (p.product_name_fr || p.product_name || p.generic_name || '').trim()
  if (!name) return null

  return {
    code: p.code ?? name,
    name,
    brand: (p.brands ?? '').split(',')[0]?.trim() ?? '',
    per100: {
      kcal,
      protein: num(n.proteins_100g) ?? 0,
      carbs: num(n.carbohydrates_100g) ?? 0,
      fat: num(n.fat_100g) ?? 0,
    },
    servingGrams: servingGrams(p),
  }
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<Food[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const url =
    `${ENDPOINT}?search_terms=${encodeURIComponent(term)}` +
    '&search_simple=1&action=process&json=1&page_size=25' +
    '&fields=code,product_name,product_name_fr,generic_name,brands,serving_size,serving_quantity,nutriments'

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open Food Facts a répondu ${res.status}`)

  const data: unknown = await res.json()
  const products = (data as { products?: OffProduct[] } | null)?.products
  if (!Array.isArray(products)) return []

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
