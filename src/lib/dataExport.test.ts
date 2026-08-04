import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const select = vi.fn()
const from = vi.fn((table: string) => ({ select: () => select(table) }))

vi.mock('./supabase', () => ({
  supabase: { from: (table: string) => from(table) },
}))

const { buildUserDataExport, downloadUserDataExport } = await import('./dataExport')

beforeEach(() => {
  from.mockClear()
  select.mockReset().mockImplementation((table: string) => ({
    data: [{ table, id: 1 }],
    error: null,
  }))
})

test('regroupe les sept tables personnelles en un seul objet', async () => {
  const result = await buildUserDataExport('u1', 'a@b.com')

  expect(result.user_id).toBe('u1')
  expect(result.email).toBe('a@b.com')
  expect(result.profile).toEqual([{ table: 'profile', id: 1 }])
  expect(result.targets).toEqual([{ table: 'targets', id: 1 }])
  expect(result.food_entries).toEqual([{ table: 'food_entries', id: 1 }])
  expect(result.weights).toEqual([{ table: 'weights', id: 1 }])
  expect(result.favorites).toEqual([{ table: 'favorites', id: 1 }])
  expect(result.water).toEqual([{ table: 'water', id: 1 }])
  expect(result.push_subscriptions).toEqual([{ table: 'push_subscriptions', id: 1 }])
})

test('n’exporte pas reminder_log, journal global sans donnée personnelle', async () => {
  const result = await buildUserDataExport('u1', null)
  expect(Object.keys(result)).not.toContain('reminder_log')
})

test('une table absente d’une ligne renvoie un tableau vide plutôt que undefined', async () => {
  select.mockImplementation((table: string) =>
    table === 'weights' ? { data: null, error: null } : { data: [], error: null }
  )
  const result = await buildUserDataExport('u1', null)
  expect(result.weights).toEqual([])
})

test('une erreur sur une table fait échouer tout l’export, plutôt qu’un fichier partiel', async () => {
  select.mockImplementation((table: string) =>
    table === 'food_entries' ? { data: null, error: { message: 'réseau' } } : { data: [], error: null }
  )
  await expect(buildUserDataExport('u1', null)).rejects.toThrow(/food_entries/)
})

const EXPORT = {
  exported_at: '2026-01-01T00:00:00.000Z',
  user_id: 'u1',
  email: 'a@b.com',
  profile: [],
  targets: [],
  food_entries: [],
  weights: [],
  favorites: [],
  water: [],
  push_subscriptions: [],
}

test('déclenche un téléchargement nommé par date, sans laisser de lien en place', () => {
  const createObjectURL = vi.fn().mockReturnValue('blob:fake')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

  const click = vi.fn()
  const anchor = document.createElement('a')
  anchor.click = click
  const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor)

  downloadUserDataExport(EXPORT)

  expect(anchor.download).toBe('goallife-donnees-2026-01-01.json')
  expect(click).toHaveBeenCalled()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  expect(document.body.contains(anchor)).toBe(false)

  createElement.mockRestore()
})

afterEach(() => {
  vi.unstubAllGlobals()
})
