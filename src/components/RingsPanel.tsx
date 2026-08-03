import { Ring } from './Ring'
import type { MacroTotals } from '../lib/types'

/*
 * Couleurs lues depuis les variables CSS du thème (index.css), donc
 * automatiquement adaptées au mode sombre de l'iPhone. `accent` est la teinte
 * vive utilisée pour le trait de l'anneau ; `protein` est sa variante
 * assombrie, réservée au texte "+X restants" pour rester lisible sur fond
 * blanc en thème clair.
 */
const STROKE = {
  kcal: 'rgb(var(--color-ink))',
  protein: 'rgb(var(--color-accent))',
  carbs: 'rgb(var(--color-carbs))',
  fat: 'rgb(var(--color-fat))',
} as const

const LABEL = {
  kcal: 'rgb(var(--color-ink))',
  protein: 'rgb(var(--color-protein))',
  carbs: 'rgb(var(--color-carbs))',
  fat: 'rgb(var(--color-fat))',
} as const

export function RingsPanel({
  totals,
  targets,
}: {
  totals: MacroTotals
  targets: MacroTotals
}) {
  return (
    <div className="card">
      <div className="grid grid-cols-2 gap-x-2 gap-y-5">
        <Ring
          label="Calories"
          value={totals.kcal}
          target={targets.kcal}
          unit="kcal"
          color={STROKE.kcal}
          labelColor={LABEL.kcal}
        />
        <Ring
          label="Protéines"
          value={totals.protein}
          target={targets.protein}
          unit="g"
          color={STROKE.protein}
          labelColor={LABEL.protein}
        />
        <Ring
          label="Glucides"
          value={totals.carbs}
          target={targets.carbs}
          unit="g"
          color={STROKE.carbs}
          labelColor={LABEL.carbs}
        />
        <Ring
          label="Lipides"
          value={totals.fat}
          target={targets.fat}
          unit="g"
          color={STROKE.fat}
          labelColor={LABEL.fat}
        />
      </div>
    </div>
  )
}
