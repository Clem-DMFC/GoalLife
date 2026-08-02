import { labelCompact } from '../lib/date'
import type { DayTotals } from '../hooks/useHistory'

/** Résumé des jours passés — tap sur une ligne pour y naviguer. */
export function HistoryCard({
  rows,
  target,
  currentDay,
  onPick,
}: {
  rows: DayTotals[]
  target: number
  currentDay: string
  onPick: (day: string) => void
}) {
  if (rows.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-black/40">
        Historique
      </h2>
      <ul className="card divide-y divide-black/5 p-0">
        {rows.map((r) => {
          const pct = target > 0 ? Math.min(1, r.kcal / target) : 0
          return (
            <li key={r.day}>
              <button
                type="button"
                className="tap flex w-full items-center gap-3 px-4 py-2.5 text-left disabled:opacity-100"
                onClick={() => onPick(r.day)}
              >
                <span
                  className={`w-24 shrink-0 truncate text-sm first-letter:uppercase ${
                    r.day === currentDay ? 'font-semibold' : 'text-black/70'
                  }`}
                >
                  {labelCompact(r.day)}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
                  <span
                    className="block h-full rounded-full bg-ink"
                    style={{ width: `${pct * 100}%` }}
                  />
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-[11px] tabular-nums text-black/50">
                  {r.kcal} kcal
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
