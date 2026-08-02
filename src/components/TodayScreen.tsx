import { useState } from 'react'
import { DayNav } from './DayNav'
import { EntryForm } from './EntryForm'
import { EntryList } from './EntryList'
import { PresetGrid } from './PresetGrid'
import { RingsPanel } from './RingsPanel'
import { TargetsSheet } from './TargetsSheet'
import { HistoryCard } from './HistoryCard'
import { useFoodEntries } from '../hooks/useFoodEntries'
import { useHistory, weeklyAverage } from '../hooks/useHistory'
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
  const [sheet, setSheet] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const { rows } = useHistory(userId, 14, historyKey)
  const week = weeklyAverage(rows)

  // L'historique se recalcule après chaque écriture du jour courant.
  const bump = () => setHistoryKey((k) => k + 1)

  return (
    <div className="space-y-3">
      <DayNav day={day} onChange={onDayChange} />

      <RingsPanel totals={totals} targets={targets} />

      <div className="flex items-center gap-2">
        <button type="button" className="btn-ghost flex-1 py-2.5 text-sm" onClick={() => setSheet(true)}>
          Objectifs
        </button>
        {week.days > 0 && (
          <div className="flex-1 rounded-xl bg-white px-3 py-2 text-center shadow-sm">
            <div className="font-mono text-sm font-semibold tabular-nums">{week.avg}</div>
            <div className="text-[10px] leading-tight text-black/40">
              kcal / j · {week.days} j
            </div>
          </div>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-black/40">
          Raccourcis
        </h2>
        <PresetGrid
          onAdd={async (p) => {
            await add(p)
            bump()
          }}
        />
      </section>

      <EntryForm
        onAdd={async (e) => {
          await add(e)
          bump()
        }}
      />

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-black/40">
          Entrées du jour
        </h2>
        {loading ? (
          <div className="card text-center text-sm text-black/30">Chargement…</div>
        ) : (
          <EntryList
            entries={entries}
            onRemove={async (id) => {
              await remove(id)
              bump()
            }}
          />
        )}
      </section>

      <HistoryCard rows={rows} target={targets.kcal} currentDay={day} onPick={onDayChange} />

      {error && <p className="px-1 text-sm text-protein">{error}</p>}

      {sheet && (
        <TargetsSheet targets={targets} onClose={() => setSheet(false)} onSave={onSaveTargets} />
      )}
    </div>
  )
}
