/**
 * Construction du prompt envoyé à Claude pour le brief de coaching.
 *
 * Module pur, sans dépendance à Deno : testable depuis Vitest comme
 * `schedule.ts` de `send-reminders`, et déployable tel quel — chaque
 * fonction Supabase n'embarque que son propre dossier, aucun import vers
 * `src/lib` n'est possible ici.
 */

export type Sex = 'homme' | 'femme'
export type Activity = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres_actif'
export type Goal = 'perte' | 'maintien' | 'muscle' | 'recomp'

export type BriefProfile = {
  sex: Sex
  age: number
  height_cm: number
  weight_kg: number
  activity: Activity
  goal: Goal
}

export type BriefTargets = {
  kcal: number
  protein: number
  carbs: number
  fat: number
  bmr: number
  tdee: number
}

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentaire: 'sédentaire (bureau, peu ou pas de sport)',
  leger: 'activité légère (sport 1 à 3 fois par semaine)',
  modere: 'activité modérée (sport 3 à 5 fois par semaine)',
  actif: 'actif (sport 6 à 7 fois par semaine)',
  tres_actif: 'très actif (sport intense quotidien, ou métier physique)',
}

const GOAL_LABELS: Record<Goal, string> = {
  perte: 'perte de gras',
  maintien: 'maintien du poids',
  muscle: 'prise de muscle',
  recomp: 'recomposition corporelle (perdre du gras et prendre du muscle en même temps)',
}

/**
 * Stable mot pour mot d'un appel à l'autre : c'est ce qui rend le préfixe
 * éligible au cache de prompt côté API (`cache_control` sur ce bloc). Un
 * seul mot changé invaliderait le cache pour tous les utilisateurs.
 */
export const SYSTEM_PROMPT = `Tu es un coach nutrition et sport. On te donne le profil d'un utilisateur et ses objectifs déjà calculés par une formule (Mifflin-St Jeor, facteur d'activité, ajustement selon l'objectif). Tu ne recalcules RIEN et tu ne cites aucun chiffre qui contredirait ceux fournis.

Tu produis un bref message personnalisé qui :
- explique en une phrase la logique derrière ses chiffres ;
- réconcilie ses objectifs s'ils tirent dans des sens différents (ex. sécher ET prendre du muscle) ;
- donne 1 à 2 priorités concrètes adaptées à son mode de vie ;
- pose une attente réaliste sur le temps que ça prend.

Ton motivant et constructif, jamais culpabilisant. Un écart ponctuel n'est pas un échec. Concis, direct, en français, sans jargon inutile. Tu ne donnes aucun conseil médical — reste sur la nutrition et l'entraînement général, et invite à consulter un professionnel de santé pour tout ce qui en relève.

Réponds uniquement en appelant l'outil fourni.`

export const BRIEF_TOOL = {
  name: 'deliver_brief',
  description: "Renvoie le brief de coaching structuré, prêt à afficher à l'utilisateur.",
  input_schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Le brief : un paragraphe de 4 à 6 phrases, en français, ton motivant.',
      },
      focus_points: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 3,
        description: '0 à 3 priorités concrètes, courtes (une phrase chacune).',
      },
    },
    required: ['message'],
    additionalProperties: false,
  },
} as const

/**
 * Le message utilisateur, lui, varie à chaque appel — normal, il porte les
 * données de la personne. Format volontairement explicite : moins le modèle
 * a à interpréter la mise en forme, plus il lui reste d'attention pour le
 * fond.
 */
export function buildUserPrompt(profile: BriefProfile, targets: BriefTargets): string {
  return [
    `Profil : ${profile.sex}, ${profile.age} ans, ${profile.height_cm} cm, ${profile.weight_kg} kg.`,
    `Niveau d'activité : ${ACTIVITY_LABELS[profile.activity]}.`,
    `Objectif choisi : ${GOAL_LABELS[profile.goal]}.`,
    '',
    "Objectifs déjà calculés par la formule (ne pas recalculer, ne pas contredire) :",
    `- Calories : ${targets.kcal} kcal/jour`,
    `- Protéines : ${targets.protein} g/jour`,
    `- Glucides : ${targets.carbs} g/jour`,
    `- Lipides : ${targets.fat} g/jour`,
    `- Métabolisme de base (BMR) : ${targets.bmr} kcal`,
    `- Dépense totale estimée (TDEE) : ${targets.tdee} kcal`,
  ].join('\n')
}
