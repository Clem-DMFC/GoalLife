import { useEffect, useRef, useState } from 'react'

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
 * Suivi de l'eau, en trois lignes compactes.
 *
 * La gourde animée occupait un quart de l'écran pour une information qui tient
 * dans une barre. Les corrections — annuler, remettre à zéro — passent derrière
 * un menu : on les cherche une fois par semaine, elles n'ont pas à peser autant
 * que les boutons d'ajout.
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const ratio = target > 0 ? ml / target : 0
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  const done = target > 0 && ml >= target

  // Un tap hors du menu le referme : sur mobile il n'y a pas d'échappement.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  const run = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setMenuOpen(false)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-1.5 px-3 py-2.5">
      {/* Total et boutons sur la même ligne : c'est ce qui fait tenir tout le
          bloc en deux lignes, sans rogner les cibles de tap. */}
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-[13px]">
          💧
        </span>
        <span className="shrink-0 font-mono text-[13px] font-medium tabular-nums">
          {format(ml)}
          <span className="text-ink/35"> / {format(target)}</span>
        </span>
        <span className="flex-1" />

        {QUICK_ML.map(([delta, label]) => (
          <button
            key={delta}
            type="button"
            title={label}
            aria-label={`Ajouter ${delta} millilitres (${label})`}
            className="flex h-9 w-[52px] shrink-0 select-none items-center justify-center rounded-lg bg-carbs/10 font-mono text-[12px] font-medium tabular-nums transition-colors active:bg-carbs/25 disabled:opacity-40"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => void run(() => onAdd(delta))}
            disabled={busy}
          >
            +{delta}
          </button>
        ))}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Corriger"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 select-none items-center justify-center rounded-lg text-ink/35 disabled:opacity-40"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => setMenuOpen((o) => !o)}
            disabled={busy || (ml === 0 && !canUndo)}
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute bottom-full right-0 z-20 mb-1 w-44 overflow-hidden rounded-xl bg-surface py-1 shadow-lg ring-1 ring-ink/10">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[12px] disabled:opacity-40"
                onClick={() => void run(onUndo)}
                disabled={!canUndo}
              >
                Annuler le dernier
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[12px] text-danger disabled:opacity-40"
                onClick={() => void run(onReset)}
                disabled={ml === 0}
              >
                Remettre à zéro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barre et pourcentage sur la seconde ligne, à hauteur de texte. */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
          <div
            className="h-full rounded-full bg-carbs transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={`w-10 shrink-0 text-right font-mono text-[11px] tabular-nums ${
            done ? 'text-protein' : 'text-ink/40'
          }`}
        >
          {pct} %
        </span>
      </div>
    </div>
  )
}
