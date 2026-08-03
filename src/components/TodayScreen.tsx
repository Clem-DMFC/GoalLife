import { useState } from 'react'
import { DayNav } from './DayNav'
import { EntryForm } from './EntryForm'
import { EntryList } from './EntryList'
import { FoodSearchSheet } from './FoodSearchSheet'
import { QuickAdd } from './QuickAdd'
import { RingsPanel } from './RingsPanel'
import { TargetsSheet } from './TargetsSheet'
import { HistoryCard } from './HistoryCard'
import { useFoodEntries, type NewEntry } from '../hooks/useFoodEntries'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory, weeklyAverage } from '../hooks/useHistory'
import { useRecents } from '../hooks/useRecents'
import type { MacroTotals } from '../lib/types'

export function TodayScreen({
  userId,
  day,
  onDayChange,
  targets,
  onSaveTargets,
}: {
  userId: string
  day: string
  onDayChange: (day: string) => void
  targets: MacroTotals
  onSaveTargets: (t: MacroTotals) => Promise<void>
}) {
  const { entries, totals, loading, error, add, remove } = useFoodEntries(userId, day)
  const [sheet, setSheet] = useState<'targets' | 'search' | null>(null)
  const [dataKey, setDataKey] = useState(0)
  const { rows } = useHistory(userId, 14, dataKey)
  const { recents } = useRecents(userId, dataKey)
  const { favorites, add: addFavorite, remove: removeFavorite } = useFavorites(userId)
  const week = weeklyAverage(rows)

  // Historique et récents se recalculent après chaque écriture.
  const addEntry = async (entry: NewEntry) => {
    await add(entry)
    setDataKey((k) => k + 1)
  }

  return (
    <div className="space-y-3">
      <DayNav day={day} onChange={onDayChange} />

      <RingsPanel totals={totals} targets={targets} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost flex-1 py-2.5 text-sm"
          onClick={() => setSheet('targets')}
        >
          Objectifs
        </button>
        {week.days > 0 && (
          <div className="flex-1 rounded-xl bg-surface px-3 py-2 text-center shadow-sm">
            <div className="font-mono text-sm font-semibold tabular-nums">{week.avg}</div>
            <div className="text-[10px] leading-tight text-ink/40">
              kcal / j · {week.days} j
            </div>
          </div>
        )}
      </div>

      <QuickAdd
        favorites={favorites}
        recents={recents}
        onAdd={addEntry}
        onSaveFavorite={addFavorite}
        onRemoveFavorite={removeFavorite}
        onOpenSearch={() => setSheet('search')}
      />

      <EntryForm onAdd={addEntry} />

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

      <HistoryCard rows={rows} target={targets.kcal} currentDay={day} onPick={onDayChange} />

      {error && <p className="px-1 text-sm text-danger">{error}</p>}

      {sheet === 'targets' && (
        <TargetsSheet
          targets={targets}
          onClose={() => setSheet(null)}
          onSave={onSaveTargets}
        />
      )}

      {sheet === 'search' && (
        <FoodSearchSheet
          onClose={() => setSheet(null)}
          onAdd={addEntry}
          onSaveFavorite={addFavorite}
        />
      )}
    </div>
  )
}
