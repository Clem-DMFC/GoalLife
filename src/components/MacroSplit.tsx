import { macroKcal, macroSplit, wholePercents, type MacroKey } from '../lib/macros'
import type { MacroTotals } from '../lib/types'

/* Même convention que les anneaux : teinte vive pour le tracé, variante
   assombrie pour le texte, afin de rester lisible en thème clair. */
const ARC: Record<MacroKey, string> = {
  protein: 'rgb(var(--color-accent))',
  carbs: 'rgb(var(--color-carbs))',
  fat: 'rgb(var(--color-fat))',
}

const TEXT: Record<MacroKey, string> = {
  protein: 'rgb(var(--color-protein))',
  carbs: 'rgb(var(--color-carbs))',
  fat: 'rgb(var(--color-fat))',
}

const SIZE = 132
const STROKE = 18
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Respiration entre deux parts, en unités de circonférence. */
const GAP = 2

/**
 * Camembert de la répartition des macros de la journée.
 *
 * Les anneaux disent l'avancement vers chaque objectif ; celui-ci dit
 * l'équilibre entre les macros, que quatre jauges séparées ne montrent pas.
 * Tracé en SVG, sans librairie : trois arcs et une légende.
 */
export function MacroSplit({ totals }: { totals: MacroTotals }) {
  const slices = macroSplit(totals)
  const percents = wholePercents(slices)
  const total = macroKcal(totals)
  const empty = total === 0

  // Chaque arc démarre là où le précédent s'arrête.
  let offset = 0

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              className="text-ink/[0.07]"
              strokeWidth={STROKE}
            />
            {!empty &&
              slices.map((s) => {
                const length = s.share * CIRCUMFERENCE
                // Un arc plus court que la respiration ne se voit pas : on le
                // saute plutôt que de dessiner un point de couleur trompeur.
                if (length <= GAP) return null
                const dash = `${length - GAP} ${CIRCUMFERENCE - length + GAP}`
                const start = -offset
                offset += length
                return (
                  <circle
                    key={s.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={ARC[s.key]}
                    strokeWidth={STROKE}
                    strokeDasharray={dash}
                    strokeDashoffset={start}
                    style={{ transition: 'stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease' }}
                  />
                )
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-semibold leading-none tabular-nums">
              {empty ? '—' : total}
            </span>
            <span className="mt-1 text-[10px] leading-none text-ink/40">kcal macros</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {slices.map((s, i) => (
            <li key={s.key} className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 self-center rounded-full"
                style={{ backgroundColor: ARC[s.key] }}
              />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink/70">
                {s.label}
              </span>
              <span className="font-mono text-[12px] tabular-nums">{s.grams} g</span>
              <span
                className="w-9 text-right font-mono text-[12px] tabular-nums"
                style={{ color: empty ? undefined : TEXT[s.key] }}
              >
                {empty ? '—' : `${percents[i]} %`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
