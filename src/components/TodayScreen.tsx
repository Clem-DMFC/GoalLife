import { useState } from 'react'
import { AddSheet } from './AddSheet'
import { DayNav } from './DayNav'
import { MealSections } from './MealSections'
import { RepeatYesterday } from './RepeatYesterday'
import { RingsPanel } from './RingsPanel'
import { WaterBar } from './WaterBar'
import { useFoodEntries, type NewEntry } from '../hooks/useFoodEntries'
import { useFavorites } from '../hooks/useFavorites'
import { useRecents } from '../hooks/useRecents'
import { useWater } from '../hooks/useWater'
import { today } from '../lib/date'
import type { FoodEntry, TargetValues } from '../lib/types'

export function TodayScreen({
  userId,
  day,
  onDayChange,
  targets,
  addOpen,
  onAddOpenChange,
}: {
  userId: string
  day: string
  onDayChange: (day: string) => void
  targets: TargetValues
  /** Pilotée par la barre de navigation, qui porte le bouton d'ajout. */
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
}) {
  const { entries, totals, loading, error, add, copy, remove } = useFoodEntries(userId, day)
  const water = useWater(userId, day)
  const [dataKey, setDataKey] = useState(0)
  const { recents } = useRecents(userId, dataKey)
  const { favorites, add: addFavorite, remove: removeFavorite } = useFavorites(userId)

  // Les récents se recalculent après chaque écriture.
  const addEntry = async (entry: NewEntry) => {
    await add(entry)
    setDataKey((k) => k + 1)
  }

  // Sur un jour passé, copier un repas le recrée sur aujourd'hui — c'est ce
  // qu'on cherche à faire en consultant une journée passée.
  const isToday = day === today()
  const copyTarget = isToday ? day : today()

  const copyEntries = async (of: FoodEntry[]) => {
    await copy(of, copyTarget)
    setDataKey((k) => k + 1)
  }

  return (
    <>
      <div className="space-y-3">
        <DayNav day={day} onChange={onDayChange} />

        <RingsPanel totals={totals} targets={targets} />

        <WaterBar
          ml={water.ml}
          target={targets.water_ml}
          canUndo={water.canUndo}
          onAdd={water.add}
          onUndo={water.undo}
          onReset={water.reset}
        />

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            Entrées du jour
          </h2>
          {loading ? (
            <div className="card text-center text-sm text-ink/30">Chargement…</div>
          ) : (
            <MealSections
              entries={entries}
              onRemove={async (id) => {
                await remove(id)
                setDataKey((k) => k + 1)
              }}
              onCopy={copyEntries}
              copyLabel={isToday ? 'Dupliquer le repas' : 'Copier vers aujourd’hui'}
            />
          )}
        </section>

        {!loading && (
          <RepeatYesterday userId={userId} day={day} entries={entries} onCopy={copyEntries} />
        )}

        {(error ?? water.error) && (
          <p className="px-1 text-sm text-danger">{error ?? water.error}</p>
        )}
      </div>

      {addOpen && (
        <AddSheet
          favorites={favorites}
          recents={recents}
          onClose={() => onAddOpenChange(false)}
          onAdd={addEntry}
          onSaveFavorite={addFavorite}
          onRemoveFavorite={removeFavorite}
        />
      )}
    </>
  )
}
