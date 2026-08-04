import type { TargetValues } from './types'

/**
 * Estimation des besoins caloriques et des macros à partir du profil.
 *
 * Tout est calculé ici, sans état ni accès réseau : l'onboarding et l'écran
 * de profil s'en servent tous les deux, et le résultat se vérifie au test.
 *
 * Ces valeurs sont un point de départ statistique, pas une mesure. Deux
 * personnes de même gabarit n'ont pas la même dépense réelle ; c'est la
 * pesée sur quelques semaines qui tranche, pas la formule.
 */

export type Sex = 'homme' | 'femme'
export type Activity = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres_actif'
export type Goal = 'perte' | 'maintien' | 'muscle' | 'recomp'

export type Profile = {
  sex: Sex
  age: number
  height_cm: number
  weight_kg: number
  activity: Activity
  goal: Goal
}

/** Facteurs d'activité de Mifflin-St Jeor. */
export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
}

/** Écart appliqué au TDEE selon l'objectif. La recomposition se fait à l'entretien. */
export const GOAL_DELTAS: Record<Goal, number> = {
  perte: -0.18,
  maintien: 0,
  muscle: 0.12,
  recomp: 0,
}

/** Grammes par kilo de poids de corps. */
const PROTEIN_PER_KG = 1.9
const FAT_PER_KG = 0.9

/**
 * Plancher calorique, par sexe.
 *
 * Un petit gabarit sédentaire en perte tombe sous ces valeurs par le calcul
 * seul. On ne descend pas plus bas : en dessous, couvrir ses besoins en
 * micronutriments devient difficile, et le déficit ne tient pas dans la durée.
 */
export const KCAL_FLOOR: Record<Sex, number> = {
  homme: 1500,
  femme: 1200,
}

export const ACTIVITY_LABELS: Record<Activity, { label: string; hint: string }> = {
  sedentaire: { label: 'Sédentaire', hint: 'Bureau, peu ou pas de sport' },
  leger: { label: 'Léger', hint: 'Sport léger 1 à 3 fois par semaine' },
  modere: { label: 'Modéré', hint: 'Sport 3 à 5 fois par semaine' },
  actif: { label: 'Actif', hint: 'Sport 6 à 7 fois par semaine' },
  tres_actif: { label: 'Très actif', hint: 'Sport intense quotidien, ou métier physique' },
}

export const GOAL_LABELS: Record<Goal, { label: string; hint: string }> = {
  perte: { label: 'Perte de gras', hint: 'Déficit modéré de 18 %' },
  maintien: { label: 'Maintien', hint: 'Stabiliser le poids actuel' },
  muscle: { label: 'Prise de muscle', hint: 'Léger surplus de 12 %' },
  recomp: { label: 'Recomposition', hint: 'À l’entretien, protéines hautes' },
}

/**
 * Métabolisme de base — Mifflin-St Jeor.
 * `base` est commune aux deux sexes, seule la constante finale diffère.
 */
export function bmr(p: Pick<Profile, 'sex' | 'age' | 'height_cm' | 'weight_kg'>): number {
  const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age
  return p.sex === 'homme' ? base + 5 : base - 161
}

/** Dépense totale : le métabolisme de base multiplié par l'activité. */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity]
}

export type ComputedTargets = TargetValues & {
  /** Repris tels quels pour l'écran récapitulatif. */
  bmr: number
  tdee: number
  /** Vrai quand le plancher a relevé les calories du calcul brut. */
  floored: boolean
}

/**
 * Objectifs quotidiens déduits du profil.
 *
 * Les protéines et les lipides sont fixés au poids de corps ; les glucides
 * prennent ce qui reste des calories. C'est cet ordre qui protège la masse
 * maigre en déficit — l'inverse laisserait les protéines s'effondrer.
 */
export function computeTargets(p: Profile, current?: Pick<TargetValues, 'water_ml'>): ComputedTargets {
  const base = bmr(p)
  const total = base * ACTIVITY_FACTORS[p.activity]

  const raw = total * (1 + GOAL_DELTAS[p.goal])
  const floor = KCAL_FLOOR[p.sex]
  const kcal = Math.max(floor, Math.round(raw / 10) * 10)

  const protein = Math.round(PROTEIN_PER_KG * p.weight_kg)
  const fat = Math.round(FAT_PER_KG * p.weight_kg)

  /*
   * Les glucides absorbent le reste. Chez un gabarit très lourd et sédentaire
   * en déficit, protéines et lipides peuvent à eux seuls dépasser le total :
   * le reste devient négatif. On plancherait alors à zéro plutôt que
   * d'afficher un objectif absurde — les macros ne totalisent plus tout à fait
   * les calories, ce qui est le moindre mal.
   */
  const remaining = kcal - protein * 4 - fat * 9
  const carbs = Math.max(0, Math.round(remaining / 4))

  return {
    kcal,
    protein,
    carbs,
    fat,
    // L'hydratation ne se déduit pas de ce calcul : on garde l'objectif en
    // place, ou la valeur par défaut pour un nouveau compte.
    water_ml: current?.water_ml ?? 3000,
    bmr: Math.round(base),
    tdee: Math.round(total),
    floored: Math.round(raw / 10) * 10 < floor,
  }
}
