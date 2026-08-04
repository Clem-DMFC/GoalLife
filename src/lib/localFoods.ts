import { BASE_FOODS, CATEGORY_LABELS, type BaseFoodEntry } from '../data/aliments-base'
import { deaccent } from './openfoodfacts'
import type { Food } from './openfoodfacts'

function toFood(source: BaseFoodEntry): Food {
  return {
    // Préfixé pour ne jamais coïncider avec un code-barres OFF.
    code: `base:${source.id}`,
    name: source.name,
    // La catégorie tient lieu de sous-titre — « Féculent » plutôt que la
    // mention « sans marque » qu'affichait un résultat OFF sans marque.
    brand: CATEGORY_LABELS[source.category],
    per100: source.per100,
    servingGrams: null,
    source: 'base',
  }
}

function haystacksOf(entry: BaseFoodEntry): string[] {
  return [entry.name, ...(entry.aliases ?? [])].map((s) => deaccent(s.toLowerCase()))
}

/**
 * Recherche dans la base locale : en mémoire, sans réseau, donc instantanée à
 * chaque frappe — c'est le socle fiable pour les aliments bruts, là où Open
 * Food Facts est mauvais (base de produits emballés).
 *
 * Insensible à la casse et aux accents. Les correspondances qui commencent
 * par le terme passent avant celles qui le contiennent seulement, pour que
 * « riz » fasse remonter les deux « Riz blanc » avant un aliment qui ne
 * contiendrait « riz » qu'au milieu de son nom.
 */
export function searchLocalFoods(term: string): Food[] {
  const needle = deaccent(term.trim().toLowerCase())
  if (needle.length < 2) return []

  const starts: Food[] = []
  const contains: Food[] = []

  for (const source of BASE_FOODS) {
    const haystacks = haystacksOf(source)
    if (haystacks.some((h) => h.startsWith(needle))) starts.push(toFood(source))
    else if (haystacks.some((h) => h.includes(needle))) contains.push(toFood(source))
  }
  return [...starts, ...contains]
}
