import { Ring } from './Ring'
import type { MacroTotals } from '../lib/types'

const COLORS = {
  kcal: '#16181D',
  protein: '#F2542D',
  carbs: '#3B82C4',
  fat: '#E0A82E',
} as const

export function RingsPanel({
  totals,
  targets,
}: {
  totals: MacroTotals
  targets: MacroTotals
}) {
  return (
    <div className="card">
      <div className="grid grid-cols-2 gap-x-2 gap-y-5">
        <Ring
          label="Calories"
          value={totals.kcal}
          target={targets.kcal}
          unit="kcal"
          color={COLORS.kcal}
        />
        <Ring
          label="Protéines"
          value={totals.protein}
          target={targets.protein}
          unit="g"
          color={COLORS.protein}
        />
        <Ring
          label="Glucides"
          value={totals.carbs}
          target={targets.carbs}
          unit="g"
          color={COLORS.carbs}
        />
        <Ring
          label="Lipides"
          value={totals.fat}
          target={targets.fat}
          unit="g"
          color={COLORS.fat}
        />
      </div>
    </div>
  )
}
