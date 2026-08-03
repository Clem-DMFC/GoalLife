import { useState } from 'react'
import { EntryList } from './EntryList'
import { groupByMeal } from '../lib/meals'
import type { FoodEntry } from '../lib/types'

/**
 * Les entrées du jour, regroupées par repas. Un bloc par repas renseigné —
 * les repas vides ne s'affichent pas, la journée reste courte à lire.
 */
export function MealSections({
  entries,
  onRemove,
  onCopy,
  copyLabel,
}: {
  entries: FoodEntry[]
  onRemove: (id: string) => Promise<void>
  onCopy: (entries: FoodEntry[]) => Promise<void>
  /** Ce que fait le bouton copier, selon le jour affiché. */
  copyLabel: string
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const groups = groupByMeal(entries)

  if (groups.length === 0) {
    return <div className="card text-center text-sm text-ink/40">Aucune entrée pour ce jour.</div>
  }

  const copy = async (key: string, of: FoodEntry[]) => {
    setBusy(key)
    try {
      await onCopy(of)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const key = g.meal ?? 'other'
        return (
          <section key={key} className="space-y-1.5">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-ink/45">
                {g.label}
              </h3>
              <span className="flex-1 font-mono text-[11px] tabular-nums text-ink/40">
                {g.totals.kcal} kcal
                <span className="text-protein"> · {g.totals.protein}P</span>
              </span>
              <button
                type="button"
                title={`${copyLabel} — ${g.label}`}
                aria-label={`${copyLabel} — ${g.label}`}
                className="tap flex h-8 min-h-0 w-8 items-center justify-center rounded-lg text-ink/30 disabled:opacity-30"
                onClick={() => void copy(key, g.entries)}
                disabled={busy === key}
              >
                ⧉
              </button>
            </div>
            <EntryList entries={g.entries} onRemove={onRemove} />
          </section>
        )
      })}
    </div>
  )
}
