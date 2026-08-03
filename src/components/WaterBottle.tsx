/**
 * Gourde qui se remplit, dessinée en SVG — pas de librairie pour trois
 * courbes. Le niveau est animé en hauteur, et la surface ondule doucement
 * pour que l'eau ait l'air d'être de l'eau.
 */

/* Silhouette dans un repère 100×172 : goulot, épaules évasées, fond arrondi. */
const BODY =
  'M42 22 h16 v12 q0 4 3 6 l14 10 q9 7 9 19 v78 q0 13 -13 13 h-42 q-13 0 -13 -13 ' +
  'v-78 q0 -12 9 -19 l14 -10 q3 -2 3 -6 z'

/**
 * Bornes du niveau : le fond intérieur de la gourde (le point le plus bas du
 * tracé, sinon une lichette d'eau resterait visible à zéro), et la naissance
 * des épaules.
 */
const BOTTOM = 160
const TOP = 46

export function WaterBottle({ ratio, width = 62 }: { ratio: number; width?: number }) {
  const height = Math.round((width * 172) / 100)
  const filled = Math.max(0, Math.min(1, ratio))
  const level = BOTTOM - filled * (BOTTOM - TOP)

  return (
    <svg width={width} height={height} viewBox="0 0 100 172" aria-hidden className="shrink-0">
      <defs>
        <clipPath id="gourde-corps">
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* Bouchon */}
      <rect x="38" y="4" width="24" height="16" rx="5" className="fill-ink/20" />

      {/* Intérieur vide */}
      <path d={BODY} className="fill-ink/[0.06]" />

      <g clipPath="url(#gourde-corps)">
        {/* Masse d'eau : sa hauteur suit le total du jour. */}
        <rect
          x="0"
          width="100"
          y={level}
          height={172 - level}
          className="fill-carbs"
          style={{
            transition:
              'y 520ms cubic-bezier(0.22, 1, 0.36, 1), height 520ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {/* Surface ondulante, seulement quand il y a de l'eau à faire onduler.
            Deux groupes imbriqués : le niveau translate en Y, la vague en X.
            Sur un seul élément, l'animation écraserait la position. */}
        {filled > 0 && filled < 1 && (
          <g
            style={{
              transform: `translateY(${level - 5}px)`,
              transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <path
              className="water-wave fill-carbs"
              d="M0 0 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 v12 h-168 z"
            />
          </g>
        )}
      </g>

      {/* Contour par dessus l'eau, pour garder la silhouette nette. */}
      <path d={BODY} fill="none" className="stroke-ink/20" strokeWidth="3" />
    </svg>
  )
}
