import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { useFoodSearch } from './useFoodSearch'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response
}

afterEach(() => vi.unstubAllGlobals())

test('la base locale répond avant même qu’OFF n’ait été appelé', async () => {
  // Un fetch qui ne répond jamais : si le test passe quand même, c'est que
  // les résultats viennent bien de la base locale, sans attendre le réseau.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  const { result } = renderHook(() => useFoodSearch('riz'))

  await waitFor(() => {
    expect(result.current.results.some((f) => f.source === 'base')).toBe(true)
  })
  expect(result.current.results.map((f) => f.name)).toContain('Riz blanc, cru')
})

test('OFF en échec ne fait pas planter une recherche déjà servie par la base', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  const { result } = renderHook(() => useFoodSearch('poulet'))

  // Attendre que le débounce (400ms) déclenche l'appel réseau et échoue.
  await waitFor(() => expect(result.current.searching).toBe(false), { timeout: 2000 })

  // Malgré l'échec réseau, aucune erreur ne s'affiche : la base locale a
  // répondu. C'est exactement la règle demandée.
  expect(result.current.error).toBeNull()
  expect(result.current.results.some((f) => f.source === 'base')).toBe(true)
}, 3000)

test('sans résultat local, une panne OFF remonte bien une erreur', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  // "xyzzy" n'existe dans aucune base locale.
  const { result } = renderHook(() => useFoodSearch('xyzzy'))

  await waitFor(() => expect(result.current.searching).toBe(false), { timeout: 2000 })

  expect(result.current.error).not.toBeNull()
  expect(result.current.results).toEqual([])
}, 3000)

test('les résultats OFF s’ajoutent aux résultats locaux une fois arrivés', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      jsonResponse({
        hits: [
          {
            code: '1',
            product_name_fr: 'Riz basmati Uncle Ben’s',
            brands: 'Uncle Ben’s',
            nutriments: {
              'energy-kcal_100g': 350,
              proteins_100g: 7,
              carbohydrates_100g: 78,
              fat_100g: 1,
            },
          },
        ],
      })
    )
  )

  const { result } = renderHook(() => useFoodSearch('riz'))

  await waitFor(() => expect(result.current.searching).toBe(false), { timeout: 2000 })

  const names = result.current.results.map((f) => f.name)
  expect(names).toContain('Riz blanc, cru') // base
  expect(names).toContain('Riz basmati Uncle Ben’s') // OFF
  // La base reste en tête.
  expect(result.current.results[0].source).toBe('base')
}, 3000)

test('une requête trop courte ne renvoie rien, ni local ni OFF', () => {
  const { result } = renderHook(() => useFoodSearch('r'))
  expect(result.current.results).toEqual([])
  expect(result.current.touched).toBe(false)
})
