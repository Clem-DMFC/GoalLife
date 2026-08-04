import { useState } from 'react'
import type { FoodEntry } from '../lib/types'

/**
 * Les aliments d'un repas. Sans habillage propre : le bloc de repas qui
 * l'accueille porte déjà la carte, en superposer une seconde créerait un
 * cadre dans un cadre.
 */
export function EntryList({
  entries,
  onRemove,
}: {
  entries: FoodEntry[]
  onRemove: (id: string) => Promise<void>
}) {
  const [busy, setBusy] = useState<string | null>(null)

  if (entries.length === 0) return null

  const remove = async (id: string) => {
    setBusy(id)
    try {
      await onRemove(id)
    } finally {
      setBusy(null)
    }
  }

  return (
    <ul className="divide-y divide-ink/5">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center gap-2 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{e.name}</div>
            <div className="tabular-nums text-[11px] text-ink/50">
              {e.kcal} kcal
              <span className="text-protein"> · {e.protein}P</span>
              <span className="text-carbs"> {e.carbs}G</span>
              <span className="text-fat"> {e.fat}L</span>
            </div>
          </div>
          <button
            type="button"
            aria-label={`Supprimer ${e.name}`}
            className="tap flex w-11 items-center justify-center rounded-lg text-ink/30 active:text-danger disabled:opacity-30"
            onClick={() => void remove(e.id)}
            disabled={busy === e.id}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
