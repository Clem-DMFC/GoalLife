import { useState } from 'react'
import { EntryList } from './EntryList'
import { groupByMeal, mealForTime } from '../lib/meals'
import type { FoodEntry } from '../lib/types'

/**
 * Les entrées du jour, un bloc par repas, replié sur son sous-total.
 *
 * La liste complète occupait 545 px en permanence, pour une information qu'on
 * ne relit pas à chaque ouverture. Seul le repas de l'heure courante se
 * déplie tout seul : c'est celui qu'on vient de remplir, donc celui qu'on
 * vérifie. Les repas vides ne s'affichent toujours pas.
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
  /*
   * Initialiseur de `useState` : le repas suggéré par l'heure est calculé une
   * fois, au montage. Le recalculer à chaque rendu rouvrirait un bloc que
   * l'utilisateur vient de replier.
   */
  const [open, setOpen] = useState<Set<string>>(() => new Set<string>([mealForTime()]))
  const [busy, setBusy] = useState<string | null>(null)

  const groups = groupByMeal(entries)

  if (groups.length === 0) {
    return <div className="card text-center text-sm text-ink/40">Aucune entrée pour ce jour.</div>
  }

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const copy = async (key: string, of: FoodEntry[]) => {
    setBusy(key)
    try {
      await onCopy(of)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-1.5">
      {groups.map((g) => {
        const key = g.meal ?? 'other'
        const isOpen = open.has(key)
        return (
          <section key={key} className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            <div className="flex items-center">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(key)}
                className="flex min-h-[44px] flex-1 select-none items-center gap-2 px-4 text-left"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">
                  {g.label}
                </span>
                <span className="flex-1 tabular-nums text-[11px] text-ink/45">
                  {g.totals.kcal} kcal
                  <span className="text-protein"> · {g.totals.protein}P</span>
                </span>
                <span
                  aria-hidden
                  className={`text-[9px] text-ink/30 transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                >
                  ▶
                </span>
              </button>

              {/* La copie n'apparaît qu'une fois le repas ouvert : sur une
                  ligne repliée, elle rivaliserait avec la cible de tap. */}
              {isOpen && (
                <button
                  type="button"
                  title={`${copyLabel} — ${g.label}`}
                  aria-label={`${copyLabel} — ${g.label}`}
                  className="flex h-11 w-10 shrink-0 select-none items-center justify-center text-ink/30 disabled:opacity-30"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => void copy(key, g.entries)}
                  disabled={busy === key}
                >
                  ⧉
                </button>
              )}
            </div>

            {isOpen && (
              <div className="border-t border-ink/5">
                <EntryList entries={g.entries} onRemove={onRemove} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
