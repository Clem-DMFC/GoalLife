import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ProfileSheet } from './ProfileSheet'
import { requestStrategyBrief } from '../lib/strategyBrief'
import type { Profile } from '../lib/nutrition'
import type { TargetValues } from '../lib/types'

vi.mock('../lib/strategyBrief', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/strategyBrief')>('../lib/strategyBrief')
  return { ...actual, requestStrategyBrief: vi.fn() }
})

const mockedBrief = vi.mocked(requestStrategyBrief)

beforeEach(() => {
  mockedBrief.mockReset()
  mockedBrief.mockResolvedValue({ message: 'Un conseil.', focusPoints: [] })
})

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

const PROFILE: Profile = {
  sex: 'homme',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere',
  goal: 'maintien',
}

/** Ce que le calcul donne pour PROFILE — donc « aucun changement ». */
const MATCHING: TargetValues = {
  kcal: 2760,
  protein: 152,
  carbs: 376,
  fat: 72,
  water_ml: 3000,
}

/** Des objectifs ajustés à la main, qu'un recalcul écraserait. */
const TUNED: TargetValues = { kcal: 2400, protein: 170, carbs: 250, fat: 70, water_ml: 2500 }

function setup(targets: TargetValues, profile: Profile | null = PROFILE) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  const onSaveBrief = vi.fn().mockResolvedValue(undefined)
  render(
    <ProfileSheet
      profile={profile}
      targets={targets}
      onClose={onClose}
      onSave={onSave}
      onSaveBrief={onSaveBrief}
    />
  )
  return { onSave, onClose, onSaveBrief }
}

const click = (label: string | RegExp) =>
  act(() => void fireEvent.click(screen.getByText(label)))

test('pré-remplit le profil existant', () => {
  setup(MATCHING)
  expect((screen.getByLabelText('Âge') as HTMLInputElement).value).toBe('30')
  expect((screen.getByLabelText('Poids') as HTMLInputElement).value).toBe('80')
  expect(screen.getByText('Homme').getAttribute('aria-pressed')).toBe('true')
})

test('écraser les objectifs demande confirmation', async () => {
  const { onSave } = setup(TUNED)

  click('Enregistrer et recalculer les objectifs')

  // Rien n'est écrit tant que la confirmation n'est pas donnée : l'utilisateur
  // a pu ajuster ses objectifs à la main.
  expect(onSave).not.toHaveBeenCalled()
  expect(screen.getByText(/Remplacer tes objectifs actuels/)).toBeDefined()
  // Les valeurs actuelles sont rappelées avant de les perdre.
  expect(screen.getByText(/2400 kcal/)).toBeDefined()

  await act(async () => void fireEvent.click(screen.getByText('Remplacer')))
  expect(onSave).toHaveBeenCalledWith(
    PROFILE,
    expect.objectContaining({ kcal: 2760, protein: 152 })
  )
})

test('annuler la confirmation ne touche à rien', () => {
  const { onSave } = setup(TUNED)
  click('Enregistrer et recalculer les objectifs')
  click('Annuler')

  expect(onSave).not.toHaveBeenCalled()
  expect(screen.getByText('Enregistrer et recalculer les objectifs')).toBeDefined()
})

test('on peut enregistrer le profil sans toucher aux objectifs', async () => {
  const { onSave } = setup(TUNED)

  await act(async () => void fireEvent.click(screen.getByText('Enregistrer le profil seul')))

  // Un seul argument : les objectifs ajustés à la main restent en place.
  expect(onSave).toHaveBeenCalledWith(PROFILE)
  expect(onSave.mock.calls[0]).toHaveLength(1)
})

test('le recalcul conserve l’objectif d’eau, qu’il ne sait pas déduire', async () => {
  const { onSave } = setup(TUNED)
  click('Enregistrer et recalculer les objectifs')
  await act(async () => void fireEvent.click(screen.getByText('Remplacer')))

  expect(onSave.mock.calls[0][1]).toMatchObject({ water_ml: 2500 })
})

test('quand le calcul ne changerait rien, le recalcul n’est pas proposé', () => {
  setup(MATCHING)
  expect(screen.getByText('identiques aux tiens')).toBeDefined()
  expect(
    screen.getByText('Enregistrer et recalculer les objectifs').hasAttribute('disabled')
  ).toBe(true)
})

test('changer le poids met à jour les objectifs proposés', () => {
  setup(MATCHING)
  act(() => void fireEvent.change(screen.getByLabelText('Poids'), { target: { value: '90' } }))

  // Protéines 1.9 × 90 = 171.
  expect(screen.getByText(/171/)).toBeDefined()
  expect(
    screen.getByText('Enregistrer et recalculer les objectifs').hasAttribute('disabled')
  ).toBe(false)
})

test('une saisie hors bornes bloque l’enregistrement', () => {
  setup(MATCHING)
  act(() => void fireEvent.change(screen.getByLabelText('Poids'), { target: { value: '5' } }))

  expect(screen.getByText(/Vérifie l’âge/)).toBeDefined()
  expect(screen.getByText('Enregistrer le profil seul').hasAttribute('disabled')).toBe(true)
})

test('sans profil, la feuille s’ouvre sur des valeurs de départ', () => {
  setup(MATCHING, null)
  expect((screen.getByLabelText('Âge') as HTMLInputElement).value).toBe('30')
  expect(screen.getByText('Enregistrer le profil seul').hasAttribute('disabled')).toBe(false)
})

test('recalculer les objectifs régénère le brief, en tâche de fond', async () => {
  const { onSaveBrief } = setup(TUNED)
  click('Enregistrer et recalculer les objectifs')
  await act(async () => void fireEvent.click(screen.getByText('Remplacer')))

  expect(mockedBrief).toHaveBeenCalledWith(PROFILE, expect.objectContaining({ kcal: 2760 }))
  await act(async () => {})
  expect(onSaveBrief).toHaveBeenCalledWith('Un conseil.')
})

test('enregistrer le profil seul ne régénère pas le brief', async () => {
  const { onSaveBrief } = setup(TUNED)
  await act(async () => void fireEvent.click(screen.getByText('Enregistrer le profil seul')))

  expect(mockedBrief).not.toHaveBeenCalled()
  expect(onSaveBrief).not.toHaveBeenCalled()
})

test('un échec du brief après recalcul reste silencieux', async () => {
  mockedBrief.mockRejectedValue(new Error('panne'))
  const { onSave, onClose } = setup(TUNED)
  click('Enregistrer et recalculer les objectifs')
  await act(async () => void fireEvent.click(screen.getByText('Remplacer')))

  // Les objectifs sont bien enregistrés et la feuille se ferme malgré l'échec du brief.
  expect(onSave).toHaveBeenCalled()
  expect(onClose).toHaveBeenCalled()
})
