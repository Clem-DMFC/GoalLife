import { useState } from 'react'
import { WaterBottle } from './WaterBottle'

/** Verre, bouteille, gourde — les trois contenants du quotidien. */
const QUICK_ML: [number, string][] = [
  [250, 'Verre'],
  [500, 'Bouteille'],
  [750, 'Gourde'],
]

function format(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`
}

/**
 * Suivi de l'eau, sous les anneaux : une gourde qui se remplit vaut mieux
 * qu'un cinquième anneau dans la grille. L'incrément reste fait en base
 * (`add_water`), cet écran n'en montre que le résultat.
 */
export function WaterBar({
  ml,
  target,
  canUndo,
  onAdd,
  onUndo,
  onReset,
}: {
  ml: number
  target: number
  canUndo: boolean
  onAdd: (delta: number) => Promise<void>
  onUndo: () => Promise<void>
  onReset: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  /** Change à chaque ajout pour rejouer l'animation de la gourde. */
  const [pulse, setPulse] = useState(0)

  const ratio = target > 0 ? ml / target : 0
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  const done = ml >= target && target > 0
  const left = Math.max(0, target - ml)

  const run = async (fn: () => Promise<void>, pulsing = false) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      if (pulsing) setPulse((p) => p + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-4">
        {/* `key` relance l'animation à chaque ajout : sans lui, la classe est
            déjà posée et le navigateur ne rejoue rien. */}
        <div key={pulse} className={pulse > 0 ? 'water-pulse' : undefined}>
          <WaterBottle ratio={ratio} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-ink/45">Eau</div>
          <div className="mt-0.5 tabular-nums text-2xl font-semibold leading-none">
            {format(ml)}
          </div>
          <div className="mt-1 tabular-nums text-[11px] text-ink/40">
            objectif {format(target)} · {pct} %
          </div>
          <div className="mt-1.5 text-[11px] leading-snug">
            {done ? (
              <span className="text-protein">Objectif atteint 💧</span>
            ) : (
              <span className="text-ink/45">{format(left)} restants</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {QUICK_ML.map(([delta, label]) => (
          <button
            key={delta}
            type="button"
            className="tap flex flex-1 flex-col items-center justify-center rounded-xl bg-carbs/10 px-1 font-medium text-ink transition-colors active:bg-carbs/25 disabled:opacity-40"
            onClick={() => void run(() => onAdd(delta), true)}
            disabled={busy}
          >
            <span className="tabular-nums text-sm">+{delta}</span>
            <span className="text-[10px] font-normal text-ink/45">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-3 text-[11px] text-ink/40">
        <button
          type="button"
          className="underline underline-offset-2 disabled:no-underline disabled:opacity-40"
          onClick={() => void run(onUndo)}
          disabled={busy || !canUndo}
        >
          Annuler le dernier
        </button>
        <button
          type="button"
          className="underline underline-offset-2 disabled:no-underline disabled:opacity-40"
          onClick={() => void run(onReset)}
          disabled={busy || ml === 0}
        >
          Remettre à zéro
        </button>
      </div>
    </div>
  )
}
