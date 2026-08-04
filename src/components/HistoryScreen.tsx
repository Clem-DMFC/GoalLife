import { useState } from 'react'
import { HistoryCard } from './HistoryCard'
import { useToast } from './Toaster'
import { useHistory, weeklyAverage } from '../hooks/useHistory'
import { labelCompact, today } from '../lib/date'
import { duplicateDay } from '../lib/entries'

/** Moyenne hebdo et 14 derniers jours — tap sur un jour pour aller le consulter. */
export function HistoryScreen({
  userId,
  targetKcal,
  onPickDay,
}: {
  userId: string
  targetKcal: number
  onPickDay: (day: string) => void
}) {
  const { rows, loading, reload } = useHistory(userId, 14)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const toast = useToast()
  const week = weeklyAverage(rows)

  // Duplication alimentaire seule : ni l'eau ni le poids ne sont recopiés.
  const duplicate = async (day: string) => {
    setDuplicating(day)
    try {
      const count = await duplicateDay(userId, day, today())
      if (count === 0) toast.error(`Rien à copier depuis ${labelCompact(day)}.`)
      else
        toast.success(
          `${count} entrée${count > 1 ? 's' : ''} du ${labelCompact(day)} copiée${
            count > 1 ? 's' : ''
          } sur aujourd’hui`
        )
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la duplication')
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-[11px] uppercase tracking-wide text-ink/40">Moyenne 7 jours</div>
        <div className="mt-1 tabular-nums text-2xl font-semibold">
          {week.days > 0 ? week.avg : '—'}
          <span className="ml-1 text-sm font-normal text-ink/40">kcal / j</span>
        </div>
        <div className="text-[11px] text-ink/40">
          {week.days > 0 ? `sur ${week.days} jour${week.days > 1 ? 's' : ''} renseigné${week.days > 1 ? 's' : ''}` : 'pas encore de données cette semaine'}
        </div>
      </div>

      {loading ? (
        <div className="card text-center text-sm text-ink/30">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="card text-center text-sm text-ink/40">
          Rien à afficher pour l'instant. L'historique se remplit au fil de tes saisies.
        </div>
      ) : (
        <HistoryCard
          rows={rows}
          target={targetKcal}
          currentDay={today()}
          onPick={onPickDay}
          onDuplicate={(d) => void duplicate(d)}
          duplicating={duplicating}
        />
      )}
    </div>
  )
}
