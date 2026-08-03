/** Les quatre écrans de l'app, dans l'ordre de la barre de navigation. */
export type Tab = 'today' | 'history' | 'weight' | 'settings'

export const TAB_TITLES: Record<Tab, string> = {
  today: 'GoalLife',
  history: 'Historique',
  weight: 'Poids',
  settings: 'Réglages',
}
