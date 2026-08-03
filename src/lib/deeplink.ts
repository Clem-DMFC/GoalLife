import { MEAL_TYPES } from './meals'
import type { MealType } from './types'
import type { Tab } from './tabs'

/**
 * Deep link porté par les notifications (`/?go=weight`, `/?go=add&meal=diner`,
 * `/?go=water`).
 *
 * Le clic sur un rappel doit tomber sur l'écran concerné, pas sur l'accueil :
 * un rappel « déjeuner » qui oblige à rouvrir la feuille d'ajout à la main a
 * raté sa cible.
 */
export type DeepLink = {
  tab: Tab
  /** Ouvre la feuille d'ajout, avec ce repas pré-sélectionné. */
  meal?: MealType
  openAdd?: boolean
  /** Amène l'attention sur la carte de l'eau. */
  focusWater?: boolean
}

function isMeal(v: string | null): v is MealType {
  return v !== null && (MEAL_TYPES as string[]).includes(v)
}

/** Lit le deep link d'une query string. `null` si elle n'en porte pas. */
export function readDeepLink(search: string): DeepLink | null {
  const params = new URLSearchParams(search)
  const go = params.get('go')
  if (!go) return null

  switch (go) {
    case 'weight':
      return { tab: 'weight' }
    case 'water':
      return { tab: 'today', focusWater: true }
    case 'add': {
      const meal = params.get('meal')
      // Repas absent ou inconnu : la feuille s'ouvre quand même, et retombe
      // sur la suggestion horaire habituelle.
      return { tab: 'today', openAdd: true, meal: isMeal(meal) ? meal : undefined }
    }
    case 'history':
      return { tab: 'history' }
    case 'today':
      return { tab: 'today' }
    default:
      return null
  }
}

/**
 * Retire les paramètres de l'URL une fois le lien consommé, pour qu'un
 * rechargement ne rouvre pas indéfiniment la même feuille.
 */
export function clearDeepLink() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return
  window.history.replaceState({}, '', window.location.pathname)
}
