import type { MacroTotals } from '../lib/types'

const BREAKDOWN = [
  { key: 'protein', label: 'Protéines', color: 'text-protein' },
  { key: 'carbs', label: 'Glucides', color: 'text-carbs' },
  { key: 'fat', label: 'Lipides', color: 'text-fat' },
] as const

/**
 * Les trois macros en grammes, sur trois colonnes. Utilisée là où les
 * calories sont déjà affichées en gros à côté : `MacroLine` les répéterait.
 */
export function MacroBreakdown({ totals }: { totals: MacroTotals }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BREAKDOWN.map((m) => (
        <div key={m.key}>
          <div className="text-[11px] text-ink/45">{m.label}</div>
          <div className={`font-mono text-lg font-semibold tabular-nums ${m.color}`}>
            {totals[m.key]}
            <span className="ml-0.5 text-[11px] font-normal text-ink/40">g</span>
          </div>
        </div>
      ))}
    </div>
  )
}

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
