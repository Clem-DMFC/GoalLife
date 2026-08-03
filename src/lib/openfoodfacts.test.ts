import { afterEach, describe, expect, test, vi } from 'vitest'
import { buildQuery, deaccent, normalizeQuery, searchFoods, SearchError } from './openfoodfacts'

describe('normalizeQuery', () => {
  test('ramène la casse et les espaces à une forme unique', () => {
    expect(normalizeQuery('  Poulet  Rôti ')).toBe('poulet rôti')
    expect(normalizeQuery('POULET')).toBe('poulet')
  })

  test('retire les opérateurs Lucene que l’API refusait', () => {
    // Le tiret valait un NOT : « saint-nectaire » excluait « nectaire ».
    expect(normalizeQuery('saint-nectaire')).toBe('saint nectaire')
    // Une parenthèse seule faisait répondre 400 au lieu de chercher.
    expect(normalizeQuery('pain (complet')).toBe('pain complet')
    expect(normalizeQuery('lait 1/2 écrémé')).toBe('lait 1 2 écrémé')
    expect(normalizeQuery('riz!')).toBe('riz')
  })

  test('laisse intact un nom d’aliment ordinaire', () => {
    expect(normalizeQuery('crème fraîche')).toBe('crème fraîche')
    expect(normalizeQuery("blanc d'oeuf")).toBe("blanc d'oeuf")
  })
})

describe('buildQuery', () => {
  test('cherche les deux formes quand le terme est accentué', () => {
    // « crème » est indexé accentué : l'envoyer seul déaccentué le perdrait.
    expect(buildQuery('crème')).toBe('(crème) OR (creme)')
    expect(buildQuery('pôulet')).toBe('(pôulet) OR (poulet)')
  })

  test('n’alourdit pas un terme sans accent', () => {
    expect(buildQuery('poulet')).toBe('poulet')
  })
})

test('deaccent replie les diacritiques', () => {
  expect(deaccent('crème brûlée')).toBe('creme brulee')
  expect(deaccent('poulet')).toBe('poulet')
})

// --- searchFoods ------------------------------------------------------

const HIT = {
  code: '123',
  product_name_fr: 'Blanc de poulet',
  brands: 'Le Gaulois',
  nutriments: { 'energy-kcal_100g': 110, proteins_100g: 23, carbohydrates_100g: 1, fat_100g: 2 },
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response
}

function htmlResponse(status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'text/html' },
    json: async () => ({}),
  } as unknown as Response
}

afterEach(() => vi.unstubAllGlobals())

test('la requête part avec les langues et sans opérateur Lucene', async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ hits: [HIT] }))
  vi.stubGlobal('fetch', fetchMock)

  await searchFoods('Saint-Nectaire')

  const url = fetchMock.mock.calls[0][0] as string
  expect(url).toContain('langs=fr,en')
  expect(url).toContain('boost_phrase=true')
  // Le tiret ne doit plus atteindre le parseur.
  expect(decodeURIComponent(url)).toContain('q=saint nectaire')
})

test('bascule sur l’ancienne API quand la nouvelle ne trouve rien', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ hits: [] }))
    .mockResolvedValueOnce(jsonResponse({ products: [HIT] }))
  vi.stubGlobal('fetch', fetchMock)

  const foods = await searchFoods('poulet')

  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(foods).toHaveLength(1)
  expect(foods[0].name).toBe('Blanc de poulet')
})

test('des résultats en repli ne remontent aucune erreur', async () => {
  // C'est le bug signalé : la première API tombe, la seconde répond, et
  // l'utilisateur voyait quand même une erreur au dessus de ses résultats.
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({}, 500))
    .mockResolvedValueOnce(jsonResponse({ products: [HIT] }))
  vi.stubGlobal('fetch', fetchMock)

  await expect(searchFoods('poulet')).resolves.toHaveLength(1)
})

test('sans résultat ni panne, la recherche rend une liste vide', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hits: [] })))
  await expect(searchFoods('zzzzzz')).resolves.toEqual([])
})

test('les deux endpoints en panne lèvent le motif réel', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse()))
  await expect(searchFoods('poulet')).rejects.toBeInstanceOf(SearchError)
})

test('un produit sans calories est écarté', async () => {
  const empty = { code: '9', product_name: 'Eau', nutriments: {} }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hits: [empty] })))
  await expect(searchFoods('eau')).resolves.toEqual([])
})

test('un nom traduit renvoyé en objet est lu correctement', async () => {
  const hit = { ...HIT, product_name_fr: { fr: 'Yaourt nature' } }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hits: [hit] })))
  const foods = await searchFoods('yaourt')
  expect(foods[0].name).toBe('Yaourt nature')
})

test('une recherche annulée ne se rabat pas sur l’ancienne API', async () => {
  const abort = new DOMException('aborted', 'AbortError')
  const fetchMock = vi.fn().mockRejectedValue(abort)
  vi.stubGlobal('fetch', fetchMock)

  await expect(searchFoods('poulet')).rejects.toBe(abort)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
