import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * L'onboarding ne doit apparaître qu'une fois. Le point de décision est ici :
 * `onboardingDone`. On simule les réponses de Supabase pour couvrir les trois
 * situations réelles — compte neuf, compte déjà configuré, et compte créé
 * avant l'existence de la table.
 */

const maybeSingle = vi.fn()
const upsert = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ maybeSingle }),
      upsert,
    }),
  },
}))

const { useProfile } = await import('./useProfile')

const ROW = {
  sex: 'homme',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere',
  goal: 'maintien',
  onboarding_done: true,
}

beforeEach(() => {
  maybeSingle.mockReset()
  upsert.mockReset().mockResolvedValue({ error: null })
})

afterEach(() => vi.clearAllMocks())

describe('onboardingDone', () => {
  test('compte neuf, sans ligne : l’onboarding est dû', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useProfile('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.onboardingDone).toBe(false)
    expect(result.current.profile).toBeNull()
  })

  test('compte déjà configuré : l’onboarding ne réapparaît pas', async () => {
    maybeSingle.mockResolvedValue({ data: ROW, error: null })
    const { result } = renderHook(() => useProfile('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.onboardingDone).toBe(true)
    expect(result.current.profile).toEqual({
      sex: 'homme',
      age: 30,
      height_cm: 180,
      weight_kg: 80,
      activity: 'modere',
      goal: 'maintien',
    })
  })

  test('ligne présente mais onboarding inachevé : il est repris', async () => {
    maybeSingle.mockResolvedValue({ data: { ...ROW, onboarding_done: false }, error: null })
    const { result } = renderHook(() => useProfile('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.onboardingDone).toBe(false)
  })

  /*
   * Si la migration n'est pas encore passée, la requête échoue. Enfermer
   * l'utilisateur dans un onboarding qu'on ne saura pas enregistrer serait
   * pire que de le sauter : l'app s'ouvre avec les objectifs par défaut.
   */
  test('table absente : l’app s’ouvre quand même', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'relation "profile" does not exist' },
    })
    const { result } = renderHook(() => useProfile('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.onboardingDone).toBe(true)
    expect(result.current.error).toMatch(/does not exist/)
  })

  test('un poids renvoyé en chaîne par PostgREST reste un nombre', async () => {
    maybeSingle.mockResolvedValue({ data: { ...ROW, weight_kg: '72.5' }, error: null })
    const { result } = renderHook(() => useProfile('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile?.weight_kg).toBe(72.5)
  })
})

describe('save', () => {
  test('clôt l’onboarding et retient le profil', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useProfile('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.save({
      sex: 'femme',
      age: 28,
      height_cm: 165,
      weight_kg: 60,
      activity: 'leger',
      goal: 'perte',
    })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', sex: 'femme', onboarding_done: true })
    )
    await waitFor(() => expect(result.current.onboardingDone).toBe(true))
  })

  test('une écriture ratée laisse l’onboarding ouvert', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    upsert.mockResolvedValue({ error: { message: 'réseau' } })
    const { result } = renderHook(() => useProfile('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.save({
        sex: 'homme',
        age: 30,
        height_cm: 180,
        weight_kg: 80,
        activity: 'modere',
        goal: 'maintien',
      })
    ).rejects.toBeDefined()

    expect(result.current.onboardingDone).toBe(false)
  })
})
