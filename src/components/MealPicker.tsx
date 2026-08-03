import { MEAL_LABELS, MEAL_TYPES } from '../lib/meals'
import type { MealType } from '../lib/types'

/**
 * Sélecteur de repas de la feuille d'ajout. Pré-sélectionné selon l'heure,
 * modifiable en un tap — commun à tous les modes d'ajout.
 */
export function MealPicker({
  value,
  onChange,
}: {
  value: MealType
  onChange: (meal: MealType) => void
}) {
  return (
    <div>
      <span className="label">Repas</span>
      <div className="flex gap-1">
        {MEAL_TYPES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={value === m}
            className={`tap flex-1 rounded-xl px-1 text-xs font-medium transition-colors ${
              value === m ? 'bg-accent text-[#0E1300]' : 'bg-surface text-ink/55 shadow-sm'
            }`}
            onClick={() => onChange(m)}
          >
            {MEAL_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  )
}
