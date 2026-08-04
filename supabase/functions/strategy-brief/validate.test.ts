import { describe, expect, test } from 'vitest'
import { parseBody, ValidationError } from './validate'

const VALID_PROFILE = {
  sex: 'homme',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere',
  goal: 'maintien',
}

const VALID_TARGETS = { kcal: 2760, protein: 152, carbs: 376, fat: 72, bmr: 1780, tdee: 2759 }

describe('parseBody', () => {
  test('accepte une entrée conforme', () => {
    const { profile, targets } = parseBody({ profile: VALID_PROFILE, targets: VALID_TARGETS })
    expect(profile.sex).toBe('homme')
    expect(targets.kcal).toBe(2760)
  })

  test('rejette un corps absent ou vide', () => {
    expect(() => parseBody(null)).toThrow(ValidationError)
    expect(() => parseBody(undefined)).toThrow(ValidationError)
    expect(() => parseBody('poulet')).toThrow(ValidationError)
  })

  test('rejette un sexe hors énumération', () => {
    expect(() =>
      parseBody({ profile: { ...VALID_PROFILE, sex: 'autre' }, targets: VALID_TARGETS })
    ).toThrow(/sex/)
  })

  test('rejette un âge hors bornes, dans les deux sens', () => {
    expect(() =>
      parseBody({ profile: { ...VALID_PROFILE, age: 13 }, targets: VALID_TARGETS })
    ).toThrow(/age/)
    expect(() =>
      parseBody({ profile: { ...VALID_PROFILE, age: 101 }, targets: VALID_TARGETS })
    ).toThrow(/age/)
  })

  test('rejette une activité ou un objectif inconnus', () => {
    expect(() =>
      parseBody({ profile: { ...VALID_PROFILE, activity: 'yolo' }, targets: VALID_TARGETS })
    ).toThrow(/activity/)
    expect(() =>
      parseBody({ profile: { ...VALID_PROFILE, goal: 'yolo' }, targets: VALID_TARGETS })
    ).toThrow(/goal/)
  })

  test('rejette des calories hors bornes plausibles', () => {
    expect(() =>
      parseBody({ profile: VALID_PROFILE, targets: { ...VALID_TARGETS, kcal: 100 } })
    ).toThrow(/kcal/)
    expect(() =>
      parseBody({ profile: VALID_PROFILE, targets: { ...VALID_TARGETS, kcal: 50000 } })
    ).toThrow(/kcal/)
  })

  test('rejette un nombre non fini (NaN, Infinity)', () => {
    expect(() =>
      parseBody({ profile: VALID_PROFILE, targets: { ...VALID_TARGETS, kcal: NaN } })
    ).toThrow(ValidationError)
    expect(() =>
      parseBody({ profile: VALID_PROFILE, targets: { ...VALID_TARGETS, tdee: Infinity } })
    ).toThrow(ValidationError)
  })

  test('rejette une chaîne là où un nombre est attendu', () => {
    expect(() =>
      parseBody({ profile: { ...VALID_PROFILE, age: '30' }, targets: VALID_TARGETS })
    ).toThrow(ValidationError)
  })

  test('rejette targets ou profile manquants', () => {
    expect(() => parseBody({ profile: VALID_PROFILE })).toThrow(/targets/)
    expect(() => parseBody({ targets: VALID_TARGETS })).toThrow(/profil/)
  })
})
