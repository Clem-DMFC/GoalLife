import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { SettingsScreen } from './SettingsScreen'
import { ToastProvider } from './Toaster'
import { deleteAccount } from '../lib/accountDeletion'
import { buildUserDataExport, downloadUserDataExport } from '../lib/dataExport'
import { requestStrategyBrief } from '../lib/strategyBrief'
import type { Profile } from '../lib/nutrition'
import type { Identity, StrategyBrief, TargetValues } from '../lib/types'

const signOut = vi.fn().mockResolvedValue({ error: null })

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { signOut: () => signOut() } },
}))

vi.mock('../lib/accountDeletion', () => ({
  deleteAccount: vi.fn(),
}))

vi.mock('../lib/dataExport', () => ({
  buildUserDataExport: vi.fn(),
  downloadUserDataExport: vi.fn(),
}))

vi.mock('../lib/strategyBrief', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/strategyBrief')>('../lib/strategyBrief')
  return { ...actual, requestStrategyBrief: vi.fn() }
})

vi.mock('../lib/push', async () => {
  const actual = await vi.importActual<typeof import('../lib/push')>('../lib/push')
  return {
    ...actual,
    pushBlocker: vi.fn(() => 'not-installed' as const),
    currentSubscription: vi.fn().mockResolvedValue(null),
  }
})

const mockedExport = vi.mocked(buildUserDataExport)
const mockedDownload = vi.mocked(downloadUserDataExport)
const mockedBrief = vi.mocked(requestStrategyBrief)
const mockedDelete = vi.mocked(deleteAccount)

const PROFILE: Profile = {
  sex: 'homme',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere',
  goal: 'maintien',
}

const TARGETS: TargetValues = { kcal: 2760, protein: 152, carbs: 376, fat: 72, water_ml: 3000 }
const IDENTITY: Identity = { first_name: 'Clément', avatar_url: null }
const NO_BRIEF: StrategyBrief = { strategy_brief: null, strategy_brief_generated_at: null }

beforeEach(() => {
  // `isStandalone()` (bouton « Installer l'app ») sonde `matchMedia`, absent de jsdom.
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  )
  mockedExport.mockReset().mockResolvedValue({
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
  })
  mockedDownload.mockReset()
  mockedBrief.mockReset().mockResolvedValue({ message: 'Un conseil.', focusPoints: [] })
  mockedDelete.mockReset().mockResolvedValue(undefined)
  signOut.mockClear()
})

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

function setup(brief: StrategyBrief = NO_BRIEF, profile: Profile | null = PROFILE) {
  const onSaveBrief = vi.fn().mockResolvedValue(undefined)
  render(
    <ToastProvider>
      <SettingsScreen
        email="a@b.com"
        targets={TARGETS}
        onSave={vi.fn()}
        userId="u1"
        identity={IDENTITY}
        onSaveIdentity={vi.fn()}
        profile={profile}
        onSaveProfile={vi.fn()}
        brief={brief}
        onSaveBrief={onSaveBrief}
      />
    </ToastProvider>
  )
  return { onSaveBrief }
}

test('exporter les données télécharge un fichier avec les bons identifiants', async () => {
  setup()
  await act(async () => void fireEvent.click(screen.getByText('Exporter mes données')))

  expect(mockedExport).toHaveBeenCalledWith('u1', 'a@b.com')
  expect(mockedDownload).toHaveBeenCalled()
})

test('un échec d’export affiche une erreur, sans planter l’écran', async () => {
  mockedExport.mockRejectedValue(new Error('réseau coupé'))
  setup()
  await act(async () => void fireEvent.click(screen.getByText('Exporter mes données')))

  expect(screen.getByText('réseau coupé')).toBeDefined()
})

test('sans brief stocké, le bouton propose d’en générer un', () => {
  setup()
  expect(screen.getByText('Générer un brief')).toBeDefined()
})

test('un brief stocké s’affiche, avec l’option de le régénérer', async () => {
  const { onSaveBrief } = setup({
    strategy_brief: 'Voilà ton brief.',
    strategy_brief_generated_at: '2026-01-01',
  })

  expect(screen.getByText('Voilà ton brief.')).toBeDefined()
  await act(async () => void fireEvent.click(screen.getByText('Régénérer le brief')))

  await waitFor(() => expect(onSaveBrief).toHaveBeenCalledWith('Un conseil.'))
  expect(mockedBrief).toHaveBeenCalledWith(PROFILE, expect.objectContaining({ kcal: 2760 }))
})

test('sans profil renseigné, aucune action de brief n’est proposée', () => {
  setup(NO_BRIEF, null)
  expect(screen.queryByText('Générer un brief')).toBeNull()
})

test('la suppression du compte demande confirmation avant d’agir', async () => {
  setup()
  await act(async () => void fireEvent.click(screen.getByText('Supprimer mon compte et mes données')))

  expect(mockedDelete).not.toHaveBeenCalled()
  expect(screen.getByText(/irréversible/)).toBeDefined()

  await act(async () => void fireEvent.click(screen.getByText('Confirmer la suppression')))
  expect(mockedDelete).toHaveBeenCalled()
  await waitFor(() => expect(signOut).toHaveBeenCalled())
})

test('annuler la confirmation de suppression ne supprime rien', async () => {
  setup()
  await act(async () => void fireEvent.click(screen.getByText('Supprimer mon compte et mes données')))
  await act(async () => void fireEvent.click(screen.getByText('Annuler')))

  expect(mockedDelete).not.toHaveBeenCalled()
  expect(screen.getByText('Supprimer mon compte et mes données')).toBeDefined()
})

test('un échec de suppression affiche une erreur et ne déconnecte pas', async () => {
  mockedDelete.mockRejectedValue(new Error('panne'))
  setup()
  await act(async () => void fireEvent.click(screen.getByText('Supprimer mon compte et mes données')))
  await act(async () => void fireEvent.click(screen.getByText('Confirmer la suppression')))

  expect(screen.getByText('panne')).toBeDefined()
  expect(signOut).not.toHaveBeenCalled()
})
