import { labelCompact } from '../lib/date'
import type { DayTotals } from '../hooks/useHistory'

/** Résumé des jours passés — tap sur une ligne pour y naviguer. */
export function HistoryCard({
  rows,
  target,
  currentDay,
  onPick,
  onDuplicate,
  duplicating,
}: {
  rows: DayTotals[]
  target: number
  currentDay: string
  onPick: (day: string) => void
  /** Recopie toute la journée sur aujourd'hui (alimentaire seul). */
  onDuplicate: (day: string) => void
  duplicating: string | null
}) {
  if (rows.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
        Historique
      </h2>
      <ul className="card divide-y divide-ink/5 p-0">
        {rows.map((r) => {
          const pct = target > 0 ? Math.min(1, r.kcal / target) : 0
          return (
            <li key={r.day} className="flex items-center">
              <button
                type="button"
                className="tap flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left disabled:opacity-100"
                onClick={() => onPick(r.day)}
              >
                <span
                  className={`w-24 shrink-0 truncate text-sm first-letter:uppercase ${
                    r.day === currentDay ? 'font-semibold' : 'text-ink/70'
                  }`}
                >
                  {labelCompact(r.day)}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
                  <span
                    className="block h-full rounded-full bg-ink"
                    style={{ width: `${pct * 100}%` }}
                  />
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink/50">
                  {r.kcal} kcal
                </span>
              </button>

              {/* Dupliquer aujourd'hui sur lui-même n'a pas de sens : action masquée. */}
              {r.day === currentDay ? (
                <span className="w-11" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  title="Dupliquer vers aujourd’hui"
                  aria-label={`Dupliquer le ${labelCompact(r.day)} vers aujourd’hui`}
                  className="tap flex w-11 items-center justify-center rounded-lg text-ink/30 disabled:opacity-30"
                  onClick={() => onDuplicate(r.day)}
                  disabled={duplicating !== null}
                >
                  {duplicating === r.day ? '…' : '⧉'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
