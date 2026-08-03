import { useState } from 'react'
import { WeightChart } from './WeightChart'
import { useWeights } from '../hooks/useWeights'
import { daysBetween, labelDay, today } from '../lib/date'
import type { Weight } from '../lib/types'

/**
 * Variation ramenée à 7 jours entre la pesée la plus récente et la plus proche
 * d'il y a une semaine. Renvoie null s'il n'y a pas assez de recul (< 3 jours).
 */
function weeklyDelta(weights: Weight[]): { delta: number; span: number } | null {
  if (weights.length < 2) return null
  const last = weights[weights.length - 1]
  let best: Weight | null = null
  let bestDist = Infinity
  for (const w of weights.slice(0, -1)) {
    const dist = Math.abs(daysBetween(w.day, last.day) - 7)
    if (dist < bestDist) {
      bestDist = dist
      best = w
    }
  }
  if (!best) return null
  const span = daysBetween(best.day, last.day)
  if (span < 3) return null
  return { delta: ((last.kg - best.kg) / span) * 7, span }
}

export function WeightScreen({ userId }: { userId: string }) {
  const { weights, loading, error, save } = useWeights(userId)
  const [kg, setKg] = useState('')
  const [day, setDay] = useState(today())
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const last = weights[weights.length - 1]
  const trend = weeklyDelta(weights)
  const onTrack = trend !== null && trend.delta >= 0.25 && trend.delta <= 0.5

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(kg.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0 || busy) return
    setBusy(true)
    try {
      await save(day, Math.round(value * 10) / 10)
      setKg('')
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <form className="card space-y-3" onSubmit={submit}>
        <h2 className="text-sm font-semibold">Pesée du matin</h2>
        <div className="flex gap-2">
          <input
            className="field flex-1 text-center text-xl"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            inputMode="decimal"
            placeholder={last ? last.kg.toFixed(1) : '75.0'}
            aria-label="Poids en kilogrammes"
            enterKeyHint="done"
          />
          <button type="submit" className="btn-primary px-6" disabled={busy || kg.trim() === ''}>
            {busy ? '…' : saved ? '✓' : 'OK'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink/45" htmlFor="weight-day">
            Jour
          </label>
          <input
            id="weight-day"
            type="date"
            className="field flex-1 py-2 text-sm"
            value={day}
            max={today()}
            onChange={(e) => e.target.value && setDay(e.target.value)}
          />
        </div>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <div className="card">
          <div className="text-[11px] uppercase tracking-wide text-ink/40">Dernière</div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {last ? `${last.kg.toFixed(1)}` : '—'}
            <span className="ml-1 text-sm font-normal text-ink/40">kg</span>
          </div>
          <div className="text-[11px] text-ink/40 first-letter:uppercase">
            {last ? labelDay(last.day) : 'aucune pesée'}
          </div>
        </div>

        <div className="card">
          <div className="text-[11px] uppercase tracking-wide text-ink/40">Sur 7 jours</div>
          <div
            className="mt-1 font-mono text-2xl font-semibold tabular-nums"
            style={{
              color: trend ? (onTrack ? 'rgb(var(--color-protein))' : undefined) : undefined,
            }}
          >
            {trend ? `${trend.delta >= 0 ? '+' : ''}${trend.delta.toFixed(2)}` : '—'}
            <span className="ml-1 text-sm font-normal text-ink/40">kg</span>
          </div>
          <div className="text-[11px] text-ink/40">
            {trend ? (onTrack ? 'dans la cible' : 'hors cible') : 'pas assez de recul'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center text-sm text-ink/30">Chargement…</div>
      ) : (
        <WeightChart weights={weights} />
      )}

      <div className="card text-[13px] leading-snug text-ink/55">
        <span className="font-semibold text-ink">Cible prise de muscle :</span> +0,25 à +0,5 kg
        par semaine. Plus vite, c'est surtout du gras ; plus lentement, la masse ne suit pas.
      </div>

      {error && <p className="px-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
