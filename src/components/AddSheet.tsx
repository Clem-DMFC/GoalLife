import { useState } from 'react'
import { FoodSearchSheet } from './FoodSearchSheet'
import { MealPicker } from './MealPicker'
import { QuickAdd } from './QuickAdd'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import type { NewEntry } from '../hooks/useFoodEntries'
import type { NewFavorite } from '../hooks/useFavorites'
import { mealForTime } from '../lib/meals'
import type { Favorite } from '../lib/types'
import type { Recent } from '../hooks/useRecents'

/**
 * Point d'entrée unique pour ajouter un aliment : recherche, raccourcis,
 * favoris, récents et saisie manuelle, regroupés dans une seule feuille au
 * lieu d'être empilés en permanence sur l'écran du jour.
 */
export function AddSheet({
  favorites,
  recents,
  onClose,
  onAdd,
  onSaveFavorite,
  onRemoveFavorite,
}: {
  favorites: Favorite[]
  recents: Recent[]
  onClose: () => void
  /** Renvoie `true` si l'entrée a bien été écrite — sinon la feuille reste. */
  onAdd: (entry: NewEntry) => Promise<boolean>
  onSaveFavorite: (fav: NewFavorite) => Promise<void>
  onRemoveFavorite: (id: string) => Promise<void>
}) {
  const [searching, setSearching] = useState(false)
  // Le repas est choisi une fois pour toute la feuille : peu importe le mode
  // d'ajout (recherche, preset, favori, récent, manuel), l'entrée est taguée.
  const [meal, setMeal] = useState(mealForTime())

  useLockBodyScroll()

  const addWithMeal = (entry: NewEntry) => onAdd({ ...entry, meal_type: meal })

  if (searching) {
    return (
      <FoodSearchSheet
        meal={meal}
        onMealChange={setMeal}
        onClose={onClose}
        onAdd={addWithMeal}
        onSaveFavorite={onSaveFavorite}
      />
    )
  }

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 px-4 py-3">
        <h2 className="flex-1 text-lg font-semibold">Ajouter</h2>
        <button
          type="button"
          className="tap flex w-11 items-center justify-center rounded-xl bg-surface text-ink/40 shadow-sm"
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        <MealPicker value={meal} onChange={setMeal} />

        <button
          type="button"
          className="btn-primary w-full py-3"
          onClick={() => setSearching(true)}
        >
          Rechercher un aliment
        </button>

        <QuickAdd
          favorites={favorites}
          recents={recents}
          onAdd={addWithMeal}
          onSaveFavorite={onSaveFavorite}
          onRemoveFavorite={onRemoveFavorite}
        />
      </div>
    </div>
  )
}
