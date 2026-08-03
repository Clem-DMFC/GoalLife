import { useState } from 'react'
import { AddSheet } from './AddSheet'
import { DayNav } from './DayNav'
import { EntryList } from './EntryList'
import { RingsPanel } from './RingsPanel'
import { useFoodEntries, type NewEntry } from '../hooks/useFoodEntries'
import { useFavorites } from '../hooks/useFavorites'
import { useRecents } from '../hooks/useRecents'
import type { MacroTotals } from '../lib/types'

export function TodayScreen({
  userId,
  day,
  onDayChange,
  targets,
}: {
  userId: string
  day: string
  onDayChange: (day: string) => void
  targets: MacroTotals
}) {
  const { entries, totals, loading, error, add, remove } = useFoodEntries(userId, day)
  const [addOpen, setAddOpen] = useState(false)
  const [dataKey, setDataKey] = useState(0)
  const { recents } = useRecents(userId, dataKey)
  const { favorites, add: addFavorite, remove: removeFavorite } = useFavorites(userId)

  // Les récents se recalculent après chaque écriture.
  const addEntry = async (entry: NewEntry) => {
    await add(entry)
    setDataKey((k) => k + 1)
  }

  return (
    <>
      <div className="space-y-3">
        <DayNav day={day} onChange={onDayChange} />

        <RingsPanel totals={totals} targets={targets} />

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            Entrées du jour
          </h2>
          {loading ? (
            <div className="card text-center text-sm text-ink/30">Chargement…</div>
          ) : (
            <EntryList
              entries={entries}
              onRemove={async (id) => {
                await remove(id)
                setDataKey((k) => k + 1)
              }}
            />
          )}
        </section>

        {error && <p className="px-1 text-sm text-danger">{error}</p>}

        {/* Espace réservé sous la liste pour que le bouton flottant ne masque pas
            la dernière entrée en fin de scroll. */}
        <div className="h-14" aria-hidden="true" />
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 z-40"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="mx-auto flex max-w-md justify-end px-4">
          <button
            type="button"
            className="tap pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-medium text-[#0E1300] shadow-lg"
            onClick={() => setAddOpen(true)}
            aria-label="Ajouter un aliment"
          >
            +
          </button>
        </div>
      </div>

      {addOpen && (
        <AddSheet
          favorites={favorites}
          recents={recents}
          onClose={() => setAddOpen(false)}
          onAdd={addEntry}
          onSaveFavorite={addFavorite}
          onRemoveFavorite={removeFavorite}
        />
      )}
    </>
  )
}
