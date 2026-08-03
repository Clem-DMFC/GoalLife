import { labelShort } from '../lib/date'
import type { Weight } from '../lib/types'

const W = 320
const H = 140
const PAD = { top: 12, right: 8, bottom: 20, left: 30 }

// Couleurs lues depuis les variables du thème : s'adaptent au mode sombre.
const ACCENT = 'rgb(var(--color-accent))'
const SURFACE = 'rgb(var(--color-surface))'

/** Courbe SVG des pesées (pas de lib de charts). */
export function WeightChart({ weights }: { weights: Weight[] }) {
  if (weights.length === 0) {
    return (
      <div className="card text-center text-sm text-ink/40">
        Pas encore de pesée. Saisis ton poids du matin.
      </div>
    )
  }

  const values = weights.map((w) => w.kg)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  // Marge verticale d'au moins 1 kg pour éviter une ligne écrasée.
  const span = Math.max(rawMax - rawMin, 1)
  const min = rawMin - span * 0.2
  const max = rawMax + span * 0.2

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const x = (i: number) =>
    PAD.left + (weights.length === 1 ? innerW / 2 : (i / (weights.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH

  const points = weights.map((w, i) => ({ x: x(i), y: y(w.kg), w }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area =
    `${line} L${points[points.length - 1].x.toFixed(1)},${(H - PAD.bottom).toFixed(1)}` +
    ` L${points[0].x.toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`

  const ticks = [rawMax, rawMin]

  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Courbe de poids">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              className="text-ink/[0.07]"
              strokeDasharray="3 3"
            />
            <text
              x={4}
              y={y(t) + 3}
              className="fill-ink/35"
              style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        <path d={area} fill={ACCENT} opacity={0.12} />
        <path
          d={line}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.w.id}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 4 : 2.5}
            fill={ACCENT}
            stroke={SURFACE}
            strokeWidth={i === points.length - 1 ? 2 : 0}
          />
        ))}

        <text
          x={PAD.left}
          y={H - 5}
          className="fill-ink/35"
          style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
        >
          {labelShort(weights[0].day)}
        </text>
        <text
          x={W - PAD.right}
          y={H - 5}
          textAnchor="end"
          className="fill-ink/35"
          style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
        >
          {labelShort(weights[weights.length - 1].day)}
        </text>
      </svg>
    </div>
  )
}
