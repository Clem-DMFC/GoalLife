import type { MacroTotals } from './types'

export type Preset = { name: string } & MacroTotals

export const PRESETS: Preset[] = [
  { name: 'Shake', kcal: 550, protein: 40, carbs: 45, fat: 20 },
  { name: 'Poulet 150g', kcal: 250, protein: 46, carbs: 0, fat: 6 },
  { name: 'Œufs ×2', kcal: 155, protein: 13, carbs: 1, fat: 11 },
  { name: 'Avoine 80g', kcal: 300, protein: 11, carbs: 50, fat: 6 },
  { name: 'Riz cuit 200g', kcal: 260, protein: 5, carbs: 56, fat: 1 },
  { name: 'Bière 33cl', kcal: 150, protein: 1, carbs: 13, fat: 0 },
]

/** Détail affiché sous le nom du preset. */
export const PRESET_HINTS: Record<string, string> = {
  Shake: 'whey + banane + PB + lait',
}
