import { HistoryCard } from './HistoryCard'
import { useHistory, weeklyAverage } from '../hooks/useHistory'
import { today } from '../lib/date'

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
  const { rows, loading } = useHistory(userId, 14)
  const week = weeklyAverage(rows)

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-[11px] uppercase tracking-wide text-ink/40">Moyenne 7 jours</div>
        <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
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
        <HistoryCard rows={rows} target={targetKcal} currentDay={today()} onPick={onPickDay} />
      )}
    </div>
  )
}
