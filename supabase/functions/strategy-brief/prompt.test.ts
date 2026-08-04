import { describe, expect, test } from 'vitest'
import { BRIEF_TOOL, buildUserPrompt, SYSTEM_PROMPT } from './prompt'
import type { BriefProfile, BriefTargets } from './prompt'

const PROFILE: BriefProfile = {
  sex: 'homme',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere',
  goal: 'maintien',
}

const TARGETS: BriefTargets = {
  kcal: 2760,
  protein: 152,
  carbs: 376,
  fat: 72,
  bmr: 1780,
  tdee: 2759,
}

describe('SYSTEM_PROMPT', () => {
  test('interdit explicitement de recalculer ou contredire les chiffres', () => {
    expect(SYSTEM_PROMPT).toMatch(/ne recalcules RIEN/)
    expect(SYSTEM_PROMPT).toMatch(/contredirait/)
  })

  test('interdit le conseil médical', () => {
    expect(SYSTEM_PROMPT).toMatch(/aucun conseil médical/)
  })

  test('impose un ton constructif, non culpabilisant', () => {
    expect(SYSTEM_PROMPT).toMatch(/jamais culpabilisant/)
    expect(SYSTEM_PROMPT).toMatch(/pas un échec/)
  })

  test('force la réponse à passer par l’outil', () => {
    expect(SYSTEM_PROMPT).toMatch(/appelant l'outil/)
  })
})

describe('BRIEF_TOOL', () => {
  test('exige le message, plafonne les priorités à 3', () => {
    expect(BRIEF_TOOL.input_schema.required).toEqual(['message'])
    expect(BRIEF_TOOL.input_schema.properties.focus_points.maxItems).toBe(3)
  })
})

describe('buildUserPrompt', () => {
  test('porte tous les chiffres calculés, sans qu’aucun ne manque', () => {
    const prompt = buildUserPrompt(PROFILE, TARGETS)
    for (const value of [2760, 152, 376, 72, 1780, 2759]) {
      expect(prompt).toContain(String(value))
    }
  })

  test('porte le profil en clair', () => {
    const prompt = buildUserPrompt(PROFILE, TARGETS)
    expect(prompt).toContain('homme')
    expect(prompt).toContain('30 ans')
    expect(prompt).toContain('180 cm')
    expect(prompt).toContain('80 kg')
  })

  test('exprime les codes en libellés lisibles, pas les codes bruts', () => {
    const prompt = buildUserPrompt(PROFILE, { ...TARGETS })
    expect(prompt).not.toContain('modere')
    expect(prompt).not.toContain('maintien\n') // le code brut, pas le libellé
    expect(prompt.toLowerCase()).toContain('activité modérée')
  })

  test('un objectif de recomposition explique lui-même la tension', () => {
    const prompt = buildUserPrompt({ ...PROFILE, goal: 'recomp' }, TARGETS)
    expect(prompt.toLowerCase()).toContain('perdre du gras et prendre du muscle')
  })
})
