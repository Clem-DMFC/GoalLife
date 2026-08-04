import type { BriefProfile, BriefTargets, Goal, Sex, Activity } from './prompt.ts'

/**
 * Validation de l'entrée envoyée par le client. Les mêmes bornes que
 * `src/lib/nutrition.ts` côté app (14-100 ans, 120-230 cm, 30-250 kg) : le
 * client les impose déjà, mais la fonction ne doit rien tenir pour acquis —
 * elle est ouverte sur Internet dès lors qu'un JWT valide l'appelle.
 */

const SEXES: Sex[] = ['homme', 'femme']
const ACTIVITIES: Activity[] = ['sedentaire', 'leger', 'modere', 'actif', 'tres_actif']
const GOALS: Goal[] = ['perte', 'maintien', 'muscle', 'recomp']

export class ValidationError extends Error {}

function num(v: unknown, min: number, max: number, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    throw new ValidationError(`${field} invalide.`)
  }
  return v
}

function oneOf<T extends string>(v: unknown, options: T[], field: string): T {
  if (typeof v !== 'string' || !options.includes(v as T)) {
    throw new ValidationError(`${field} invalide.`)
  }
  return v as T
}

export function parseProfile(v: unknown): BriefProfile {
  if (!v || typeof v !== 'object') throw new ValidationError('profil manquant.')
  const p = v as Record<string, unknown>
  return {
    sex: oneOf(p.sex, SEXES, 'sex'),
    age: num(p.age, 14, 100, 'age'),
    height_cm: num(p.height_cm, 120, 230, 'height_cm'),
    weight_kg: num(p.weight_kg, 30, 250, 'weight_kg'),
    activity: oneOf(p.activity, ACTIVITIES, 'activity'),
    goal: oneOf(p.goal, GOALS, 'goal'),
  }
}

export function parseTargets(v: unknown): BriefTargets {
  if (!v || typeof v !== 'object') throw new ValidationError('targets manquant.')
  const t = v as Record<string, unknown>
  return {
    kcal: num(t.kcal, 800, 6000, 'kcal'),
    protein: num(t.protein, 0, 500, 'protein'),
    carbs: num(t.carbs, 0, 1000, 'carbs'),
    fat: num(t.fat, 0, 400, 'fat'),
    bmr: num(t.bmr, 500, 4000, 'bmr'),
    tdee: num(t.tdee, 500, 6000, 'tdee'),
  }
}

export function parseBody(body: unknown): { profile: BriefProfile; targets: BriefTargets } {
  if (!body || typeof body !== 'object') throw new ValidationError('corps de requête manquant.')
  const b = body as Record<string, unknown>
  return { profile: parseProfile(b.profile), targets: parseTargets(b.targets) }
}
