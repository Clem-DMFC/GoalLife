/**
 * La marque Goatly : un G dont les épaules deviennent des cornes.
 *
 * Les chemins sont ceux de public/icons/logo.svg — toute correction doit être
 * reportée des deux côtés. En `currentColor`, donc la marque suit la couleur
 * du texte parent et bascule seule en thème sombre.
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 357) / 430)}
      viewBox="41 95 430 357"
      fill="none"
      className={className}
      role="img"
      aria-label="Goatly"
    >
      <path
        d="M387.9 296.9 A132 132 0 1 1 375.6 234.2"
        stroke="currentColor"
        strokeWidth="60"
      />
      <path d="M250 296.9 H390" stroke="currentColor" strokeWidth="56" strokeLinecap="round" />
      <path
        d="M108.3 221.1 C 78 190, 45 145, 41 95 C 75 125, 115 150, 162.5 156.5 Z"
        fill="currentColor"
      />
      <path
        d="M403.7 221.1 C 434 190, 467 145, 471 95 C 437 125, 397 150, 349.5 156.5 Z"
        fill="currentColor"
      />
    </svg>
  )
}
