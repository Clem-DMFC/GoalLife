import { useEffect, useState } from 'react'
import { addDays } from '../lib/date'
import { fetchDayEntries } from '../lib/entries'
import { groupByMeal, MEAL_LABELS } from '../lib/meals'
import type { FoodEntry, MealType } from '../lib/types'

/**
 * « Refaire le petit-déj d'hier » : les journées se ressemblent beaucoup, et
 * reprendre le repas de la veille évite de tout ressaisir. On ne propose que
 * les repas encore vides sur le jour affiché.
 */
export function RepeatYesterday({
  userId,
  day,
  entries,
  onCopy,
}: {
  userId: string
  day: string
  entries: FoodEntry[]
  onCopy: (entries: FoodEntry[]) => Promise<void>
}) {
  const [yesterday, setYesterday] = useState<FoodEntry[]>([])
  const [busy, setBusy] = useState<MealType | null>(null)

  useEffect(() => {
    let alive = true
    setYesterday([])
    fetchDayEntries(addDays(day, -1))
      .then((rows) => {
        if (alive) setYesterday(rows)
      })
      .catch(() => {
        // Un raccourci facultatif : en cas d'échec on n'affiche simplement rien.
      })
    return () => {
      alive = false
    }
  }, [userId, day])

  const already = new Set(entries.map((e) => e.meal_type))
  const groups = groupByMeal(yesterday).filter((g) => g.meal && !already.has(g.meal))

  if (groups.length === 0) return null

  const copy = async (meal: MealType, of: FoodEntry[]) => {
    setBusy(meal)
    try {
      await onCopy(of)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="space-y-1.5">
      <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/45">
        Reprendre d'hier
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <button
            key={g.meal}
            type="button"
            className="tap flex min-h-[40px] items-center gap-2 rounded-xl bg-surface px-3 text-xs shadow-sm disabled:opacity-40"
            onClick={() => void copy(g.meal!, g.entries)}
            disabled={busy !== null}
          >
            <span className="font-medium">{MEAL_LABELS[g.meal!]}</span>
            <span className="font-mono tabular-nums text-ink/45">{g.totals.kcal} kcal</span>
          </button>
        ))}
      </div>
    </section>
  )
}
