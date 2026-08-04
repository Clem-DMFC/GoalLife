import { deaccent } from './openfoodfacts'
import type { Food } from './openfoodfacts'

function key(name: string): string {
  return deaccent(name.trim().toLowerCase())
}

/**
 * Fusionne les résultats de la base locale et d'Open Food Facts, base en
 * tête. Un résultat OFF dont le nom coïncide déjà avec une entrée locale est
 * écarté : « Riz blanc, cuit » en base n'a pas besoin d'un doublon générique
 * arrivé d'OFF juste en dessous. Les variantes de marque, elles, restent —
 * seul le nom exact fait doublon.
 */
export function mergeFoods(local: Food[], off: Food[]): Food[] {
  const seen = new Set(local.map((f) => key(f.name)))
  const rest = off.filter((f) => !seen.has(key(f.name)))
  return [...local, ...rest]
}
