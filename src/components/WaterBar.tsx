import { useState } from 'react'

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
 * Barre de progression de l'eau, sous les anneaux : un cinquième anneau
 * surchargerait la grille alors que l'eau se lit très bien en linéaire.
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
  const pct = target > 0 ? Math.min(1, ml / target) : 0

  const run = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-2.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/45">Eau</span>
        <span className="flex-1 text-right font-mono text-sm tabular-nums">
          {format(ml)}
          <span className="text-ink/35"> / {format(target)}</span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-ink/[0.07]">
        <div
          className="h-full rounded-full bg-carbs transition-[width] duration-300"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="flex gap-1.5">
        {QUICK_ML.map(([delta, label]) => (
          <button
            key={delta}
            type="button"
            className="tap flex flex-1 flex-col items-center justify-center rounded-xl bg-ink/5 px-1 font-medium disabled:opacity-40"
            onClick={() => void run(() => onAdd(delta))}
            disabled={busy}
          >
            <span className="font-mono text-sm tabular-nums">+{delta}</span>
            <span className="text-[10px] font-normal text-ink/40">{label}</span>
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
