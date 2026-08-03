import type { MacroTotals } from './types'

/** Facteurs d'Atwater : ce que « pèse » un gramme de chaque macro en calories. */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

export type MacroKey = keyof typeof KCAL_PER_GRAM

export type MacroSlice = {
  key: MacroKey
  label: string
  /** Grammes consommés. */
  grams: number
  /** Calories apportées par cette macro. */
  kcal: number
  /** Part des calories des macros, entre 0 et 1. */
  share: number
}

const LABELS: Record<MacroKey, string> = {
  protein: 'Protéines',
  carbs: 'Glucides',
  fat: 'Lipides',
}

/**
 * Répartition calorique des macros, pour le camembert.
 *
 * La part est calculée sur les calories et non sur les grammes : un gramme de
 * lipide en apporte plus du double d'un gramme de protéine, et un camembert
 * en grammes donnerait une image fausse de la journée.
 *
 * Le total de référence est celui des trois macros, pas le `kcal` saisi :
 * les deux divergent souvent (alcool, fibres, arrondis des étiquettes), et
 * des parts qui ne totalisent pas 100 % se verraient tout de suite.
 */
export function macroSplit(totals: MacroTotals): MacroSlice[] {
  const kcal = {
    protein: Math.max(0, totals.protein) * KCAL_PER_GRAM.protein,
    carbs: Math.max(0, totals.carbs) * KCAL_PER_GRAM.carbs,
    fat: Math.max(0, totals.fat) * KCAL_PER_GRAM.fat,
  }
  const sum = kcal.protein + kcal.carbs + kcal.fat

  return (Object.keys(LABELS) as MacroKey[]).map((key) => ({
    key,
    label: LABELS[key],
    grams: Math.max(0, Math.round(totals[key])),
    kcal: Math.round(kcal[key]),
    share: sum > 0 ? kcal[key] / sum : 0,
  }))
}

/** Total calorique des trois macros — le dénominateur du camembert. */
export function macroKcal(totals: MacroTotals): number {
  return macroSplit(totals).reduce((acc, s) => acc + s.kcal, 0)
}

/**
 * Pourcentages entiers dont la somme fait exactement 100 (méthode du plus
 * fort reste) : « 33 / 33 / 33 » sous un camembert plein ferait tache.
 */
export function wholePercents(slices: MacroSlice[]): number[] {
  const exact = slices.map((s) => s.share * 100)
  const floors = exact.map(Math.floor)
  const missing = Math.round(exact.reduce((a, b) => a + b, 0)) - floors.reduce((a, b) => a + b, 0)

  // Les unités restantes vont aux plus grosses décimales tronquées.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)

  const out = [...floors]
  for (let k = 0; k < missing; k++) out[order[k % order.length].i] += 1
  return out
}
