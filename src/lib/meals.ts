import { EMPTY_TOTALS, type FoodEntry, type MacroTotals, type MealType } from './types'

/** Ordre chronologique, commun aux blocs du jour et au sélecteur d'ajout. */
export const MEAL_TYPES: MealType[] = ['petit_dej', 'dejeuner', 'diner', 'collation']

export const MEAL_LABELS: Record<MealType, string> = {
  petit_dej: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

export const OTHER_LABEL = 'Autre'

/**
 * Repas suggéré selon l'heure : le bon choix est déjà sélectionné dans neuf
 * cas sur dix, et reste modifiable en un tap.
 */
export function mealForTime(d: Date = new Date()): MealType {
  const h = d.getHours()
  if (h < 11) return 'petit_dej'
  if (h < 15) return 'dejeuner'
  if (h < 18) return 'collation'
  if (h < 23) return 'diner'
  return 'collation'
}

export type MealGroup = {
  /** `null` pour les entrées non classées (saisies avant l'ajout des repas). */
  meal: MealType | null
  label: string
  entries: FoodEntry[]
  totals: MacroTotals
}

/**
 * Regroupe les entrées d'un jour par repas, dans l'ordre de la journée.
 * Les repas sans entrée ne sont pas retournés.
 */
export function groupByMeal(entries: FoodEntry[]): MealGroup[] {
  const keys: (MealType | null)[] = [...MEAL_TYPES, null]

  return keys
    .map((meal) => {
      const of = entries.filter((e) => (e.meal_type ?? null) === meal)
      return {
        meal,
        label: meal ? MEAL_LABELS[meal] : OTHER_LABEL,
        entries: of,
        totals: of.reduce<MacroTotals>(
          (acc, e) => ({
            kcal: acc.kcal + e.kcal,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
          }),
          { ...EMPTY_TOTALS }
        ),
      }
    })
    .filter((g) => g.entries.length > 0)
}
