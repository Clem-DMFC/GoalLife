import type { MacroTotals } from '../lib/types'

/**
 * Résumé du jour, hiérarchisé.
 *
 * Quatre anneaux de même taille ne disaient pas ce qui compte. Ici les
 * calories restantes occupent le premier plan, les protéines viennent
 * ensuite, glucides et lipides ferment la marche. On lit l'essentiel sans
 * scroller, et sans répéter l'information deux fois.
 */

const SIZE = 120
const STROKE = 13
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Part remplie et dépassement, valables aussi pour un objectif à zéro — où
 * la division ne veut rien dire, mais où tout ce qui est mangé est en trop.
 */
function progress(value: number, target: number) {
  const over = value > target
  const filled = target > 0 ? Math.max(0, Math.min(1, value / target)) : over ? 1 : 0
  return { over, filled, left: Math.round(target - value) }
}

function Ring({ value, target }: { value: number; target: number }) {
  const { over, filled, left } = progress(value, target)

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
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
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={over ? 'rgb(var(--color-danger))' : 'rgb(var(--color-ink))'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
            style={{ transition: 'stroke-dashoffset 400ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`tabular-nums text-[27px] font-semibold leading-none ${
              over ? 'text-danger' : ''
            }`}
          >
            {over ? `+${Math.abs(left)}` : left}
          </span>
          <span className="mt-1 text-[10px] leading-none text-ink/45">
            {over ? 'en trop' : 'restantes'}
          </span>
        </div>
      </div>
      <div className="mt-1.5 tabular-nums text-[11px] text-ink/40">
        {Math.round(value)} / {target} kcal
      </div>
    </div>
  )
}

function Bar({
  label,
  value,
  target,
  color,
  strong = false,
}: {
  label: string
  value: number
  target: number
  color: string
  /** Les protéines : la macro qu'on suit vraiment, un cran plus lisible. */
  strong?: boolean
}) {
  const { filled, left } = progress(value, target)

  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={
            strong ? 'text-[12px] font-semibold' : 'text-[11px] font-medium text-ink/55'
          }
        >
          {label}
        </span>
        <span className="flex-1" />
        <span
          className={`tabular-nums ${
            strong ? 'text-[12px] font-semibold' : 'text-[11px] text-ink/70'
          }`}
        >
          {Math.round(value)}
          <span className="text-ink/35">/{target}</span>
        </span>
      </div>
      <div
        className={`mt-1 overflow-hidden rounded-full bg-ink/[0.07] ${strong ? 'h-2' : 'h-1.5'}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${filled * 100}%`, backgroundColor: color }}
        />
      </div>
      {/* Le reste à couvrir, en retrait : utile, jamais au premier plan. */}
      <div className="mt-0.5 text-right tabular-nums text-[10px] text-ink/35">
        {left > 0 ? `${left} g restants` : `+${Math.abs(left)} g`}
      </div>
    </div>
  )
}

export function DaySummary({
  totals,
  targets,
}: {
  totals: MacroTotals
  targets: MacroTotals
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <Ring value={totals.kcal} target={targets.kcal} />

        <div className="min-w-0 flex-1 space-y-2">
          <Bar
            label="Protéines"
            value={totals.protein}
            target={targets.protein}
            color="rgb(var(--color-accent))"
            strong
          />
          <div className="space-y-2 border-t border-ink/5 pt-2">
            <Bar
              label="Glucides"
              value={totals.carbs}
              target={targets.carbs}
              color="rgb(var(--color-carbs))"
            />
            <Bar
              label="Lipides"
              value={totals.fat}
              target={targets.fat}
              color="rgb(var(--color-fat))"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
