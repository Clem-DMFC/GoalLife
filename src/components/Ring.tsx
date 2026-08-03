type RingProps = {
  label: string
  value: number
  target: number
  unit: string
  /** Couleur du trait (peut être vive : c'est un graphique, pas du texte). */
  color: string
  /** Couleur du texte "+X restants" quand la cible est dépassée — distincte
   * de `color` pour les teintes trop claires en texte sur fond blanc. */
  labelColor?: string
  size?: number
}

/** Anneau de progression SVG. Dépasser la cible remplit l'anneau et l'indique en texte. */
export function Ring({ label, value, target, unit, color, labelColor, size = 92 }: RingProps) {
  const stroke = size * 0.11
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const ratio = target > 0 ? value / target : 0
  const clamped = Math.max(0, Math.min(1, ratio))
  const over = ratio > 1

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-ink/[0.07]"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
            style={{ transition: 'stroke-dashoffset 400ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[15px] font-semibold leading-none tabular-nums">
            {Math.round(value)}
          </span>
          <span className="mt-0.5 font-mono text-[10px] leading-none text-ink/40 tabular-nums">
            / {target}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[11px] font-medium text-ink/60">{label}</div>
        <div
          className="font-mono text-[10px] tabular-nums"
          style={{ color: over ? (labelColor ?? color) : undefined }}
        >
          {over
            ? `+${Math.round(value - target)} ${unit}`
            : `${Math.round(target - value)} ${unit} restants`}
        </div>
      </div>
    </div>
  )
}
