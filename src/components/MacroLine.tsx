import type { MacroTotals } from '../lib/types'

/** Ligne compacte kcal · P/G/L, réutilisée partout où on résume des macros. */
export function MacroLine({ totals }: { totals: MacroTotals }) {
  return (
    <div className="flex items-baseline gap-2 font-mono text-sm tabular-nums">
      <span className="font-semibold">{totals.kcal} kcal</span>
      <span className="text-protein">{totals.protein}P</span>
      <span className="text-carbs">{totals.carbs}G</span>
      <span className="text-fat">{totals.fat}L</span>
    </div>
  )
}
