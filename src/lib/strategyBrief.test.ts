import { afterEach, describe, expect, test, vi } from 'vitest'

const invoke = vi.fn()

vi.mock('./supabase', () => ({
  supabase: { functions: { invoke } },
}))

const { requestStrategyBrief, StrategyBriefError, formatBrief } = await import('./strategyBrief')

const PROFILE = {
  sex: 'homme' as const,
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere' as const,
  goal: 'maintien' as const,
}

const TARGETS = { kcal: 2760, protein: 152, carbs: 376, fat: 72, bmr: 1780, tdee: 2759 }

afterEach(() => invoke.mockReset())

describe('requestStrategyBrief', () => {
  test('renvoie le message et les priorités', async () => {
    invoke.mockResolvedValue({
      data: { message: 'Bonjour.', focus_points: ['Priorité A'] },
      error: null,
    })

    const result = await requestStrategyBrief(PROFILE, TARGETS)
    expect(result).toEqual({ message: 'Bonjour.', focusPoints: ['Priorité A'] })
  })

  test('envoie le profil et les objectifs déjà calculés, rien de plus', async () => {
    invoke.mockResolvedValue({ data: { message: 'Bonjour.' }, error: null })
    await requestStrategyBrief(PROFILE, TARGETS)

    expect(invoke).toHaveBeenCalledWith(
      'strategy-brief',
      expect.objectContaining({
        body: { profile: PROFILE, targets: TARGETS },
      })
    )
  })

  test('sans focus_points, renvoie un tableau vide', async () => {
    invoke.mockResolvedValue({ data: { message: 'Bonjour.' }, error: null })
    const result = await requestStrategyBrief(PROFILE, TARGETS)
    expect(result.focusPoints).toEqual([])
  })

  test('une erreur de la fonction est remontée en StrategyBriefError', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'panne' } })
    await expect(requestStrategyBrief(PROFILE, TARGETS)).rejects.toBeInstanceOf(
      StrategyBriefError
    )
  })

  test('une réponse sans message est rejetée', async () => {
    invoke.mockResolvedValue({ data: { focus_points: [] }, error: null })
    await expect(requestStrategyBrief(PROFILE, TARGETS)).rejects.toThrow(/invalide/)
  })

  test('un rejet réseau est enveloppé dans un message clair', async () => {
    invoke.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(requestStrategyBrief(PROFILE, TARGETS)).rejects.toThrow(/indisponible/)
  })
})

describe('formatBrief', () => {
  test('sans priorités, rend le message seul', () => {
    expect(formatBrief({ message: 'Bonjour.', focusPoints: [] })).toBe('Bonjour.')
  })

  test('avec des priorités, les ajoute en liste sous le message', () => {
    const text = formatBrief({ message: 'Bonjour.', focusPoints: ['Dors plus', 'Bois plus'] })
    expect(text).toContain('Bonjour.')
    expect(text).toContain('• Dors plus')
    expect(text).toContain('• Bois plus')
    expect(text.indexOf('Bonjour.')).toBeLessThan(text.indexOf('Dors plus'))
  })
})
