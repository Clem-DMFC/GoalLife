import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Onboarding } from './Onboarding'
import { requestStrategyBrief } from '../lib/strategyBrief'

vi.mock('../lib/strategyBrief', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/strategyBrief')>('../lib/strategyBrief')
  return { ...actual, requestStrategyBrief: vi.fn() }
})

const mockedBrief = vi.mocked(requestStrategyBrief)

beforeEach(() => {
  mockedBrief.mockReset()
  // Résolution immédiate par défaut : les tests qui ne s'intéressent pas au
  // brief n'ont pas à en tenir compte pour autant.
  mockedBrief.mockResolvedValue({ message: 'Un conseil du coach.', focusPoints: [] })
})

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

const click = (label: string | RegExp) =>
  act(() => void fireEvent.click(screen.getByText(label)))

const type = (label: string, value: string) =>
  act(() => void fireEvent.change(screen.getByLabelText(label), { target: { value } }))

/** Parcourt les sept premiers écrans pour un homme de 80 kg, actif modéré. */
function walkToRecap(firstName = '') {
  if (firstName) type('Ton prénom', firstName)
  click(firstName ? 'Continuer' : 'Passer')
  click('Homme')
  click('Continuer')
  type('Ton âge', '30')
  click('Continuer')
  type('Ta taille', '180')
  click('Continuer')
  type('Ton poids actuel', '80')
  click('Continuer')
  click('Modéré')
  click('Continuer')
  click('Maintien')
  click('Continuer')
}

test('le parcours mène au récapitulatif et calcule les objectifs', () => {
  render(<Onboarding onDone={vi.fn().mockResolvedValue(undefined)} />)
  walkToRecap()

  expect(screen.getByText('Tes objectifs')).toBeDefined()
  // BMR 1780 → TDEE ×1.55 = 2759 → maintien, arrondi à 2760.
  expect(screen.getByText('2760')).toBeDefined()
  expect(screen.getByText('1780 kcal')).toBeDefined()
  expect(screen.getByText('2759 kcal')).toBeDefined()
})

test('la validation remonte le profil, les objectifs, le prénom et le brief', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  render(<Onboarding onDone={onDone} />)
  walkToRecap('Clément')

  // Le brief a le temps d'arriver avant qu'on valide.
  await waitFor(() => expect(screen.getByText('Un conseil du coach.')).toBeDefined())
  await act(async () => void fireEvent.click(screen.getByText('Valider')))

  expect(onDone).toHaveBeenCalledWith(
    {
      sex: 'homme',
      age: 30,
      height_cm: 180,
      weight_kg: 80,
      activity: 'modere',
      goal: 'maintien',
    },
    // `bmr`, `tdee` et `floored` servent à l'affichage, pas à la table.
    { kcal: 2760, protein: 152, carbs: 376, fat: 72, water_ml: 3000 },
    'Clément',
    'Un conseil du coach.'
  )
})

test('le prénom est facultatif : on peut passer l’écran', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  render(<Onboarding onDone={onDone} />)

  // Sans saisie, le bouton propose de passer plutôt que de continuer.
  expect(screen.getByText('Passer')).toBeDefined()
  walkToRecap()
  await waitFor(() => expect(screen.getByText('Un conseil du coach.')).toBeDefined())
  await act(async () => void fireEvent.click(screen.getByText('Valider')))

  expect(onDone.mock.calls[0][2]).toBeNull()
})

test('le prénom saisi est repris à l’écran suivant', () => {
  render(<Onboarding onDone={vi.fn()} />)
  type('Ton prénom', 'Clément')
  expect(screen.getByText('Continuer')).toBeDefined()
  click('Continuer')
  expect(screen.getByText('Enchanté Clément')).toBeDefined()
})

test('un prénom d’espaces vaut une absence de prénom', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  render(<Onboarding onDone={onDone} />)
  type('Ton prénom', '   ')
  walkToRecap()
  await waitFor(() => expect(screen.getByText('Un conseil du coach.')).toBeDefined())
  await act(async () => void fireEvent.click(screen.getByText('Valider')))
  expect(onDone.mock.calls[0][2]).toBeNull()
})

test('on ne peut pas avancer sans avoir répondu', () => {
  render(<Onboarding onDone={vi.fn()} />)
  click('Passer')
  // Écran du sexe : aucun choix fait.
  expect(screen.getByText('Continuer').hasAttribute('disabled')).toBe(true)
  click('Femme')
  expect(screen.getByText('Continuer').hasAttribute('disabled')).toBe(false)
})

test('une valeur hors bornes bloque et s’explique', () => {
  render(<Onboarding onDone={vi.fn()} />)
  click('Passer')
  click('Homme')
  click('Continuer')

  type('Ton âge', '8')
  expect(screen.getByText(/Entre 14 et 100 ans/)).toBeDefined()
  expect(screen.getByText('Continuer').hasAttribute('disabled')).toBe(true)

  type('Ton âge', '30')
  expect(screen.getByText('Continuer').hasAttribute('disabled')).toBe(false)
})

test('le retour conserve les réponses déjà données', () => {
  render(<Onboarding onDone={vi.fn()} />)
  click('Passer')
  click('Homme')
  click('Continuer')
  type('Ton âge', '42')
  click('Retour')

  // Le choix du sexe est toujours sélectionné.
  expect(screen.getByText('Homme').closest('button')?.getAttribute('aria-pressed')).toBe('true')
  click('Continuer')
  expect((screen.getByLabelText('Ton âge') as HTMLInputElement).value).toBe('42')
})

test('un petit gabarit en perte voit le plancher expliqué', () => {
  render(<Onboarding onDone={vi.fn()} />)
  click('Passer')
  click('Femme')
  click('Continuer')
  type('Ton âge', '55')
  click('Continuer')
  type('Ta taille', '152')
  click('Continuer')
  type('Ton poids actuel', '45')
  click('Continuer')
  click('Sédentaire')
  click('Continuer')
  click('Perte de gras')
  click('Continuer')

  expect(screen.getByText('1200')).toBeDefined()
  expect(screen.getByText(/relevé à ce seuil/)).toBeDefined()
})

test('un échec d’enregistrement garde l’onboarding ouvert', async () => {
  const onDone = vi.fn().mockRejectedValue(new Error('réseau coupé'))
  render(<Onboarding onDone={onDone} />)
  walkToRecap()

  await act(async () => void fireEvent.click(screen.getByText('Valider')))

  expect(screen.getByText('réseau coupé')).toBeDefined()
  // Toujours sur le récap : rien n'est perdu, on peut réessayer.
  expect(screen.getByText('Valider')).toBeDefined()
})

test('le ton du récapitulatif présente un point de départ, pas une vérité', () => {
  render(<Onboarding onDone={vi.fn()} />)
  walkToRecap()
  expect(screen.getByText(/point de départ, pas une vérité/)).toBeDefined()
})

// --- Brief IA ---------------------------------------------------------

test('un chargement s’affiche pendant la génération du brief', async () => {
  let resolve!: (v: { message: string; focusPoints: string[] }) => void
  mockedBrief.mockReturnValue(new Promise((r) => (resolve = r)))

  render(<Onboarding onDone={vi.fn()} />)
  walkToRecap()

  expect(screen.getByText(/prépare un mot/)).toBeDefined()
  await act(async () => resolve({ message: 'Voilà.', focusPoints: [] }))
  expect(screen.queryByText(/prépare un mot/)).toBeNull()
  expect(screen.getByText('Voilà.')).toBeDefined()
})

test('les priorités s’affichent sous le message', async () => {
  mockedBrief.mockResolvedValue({
    message: 'Voilà le fond.',
    focusPoints: ['Dors plus', 'Bois de l’eau'],
  })

  render(<Onboarding onDone={vi.fn()} />)
  walkToRecap()

  await waitFor(() => expect(screen.getByText(/Voilà le fond/)).toBeDefined())
  expect(screen.getByText(/Dors plus/)).toBeDefined()
  expect(screen.getByText(/Bois de l’eau/)).toBeDefined()
})

test('un échec du brief affiche un repli discret, sans bloquer le flux', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  mockedBrief.mockRejectedValue(new Error('panne réseau'))

  render(<Onboarding onDone={onDone} />)
  walkToRecap()

  await waitFor(() => expect(screen.getByText('Brief indisponible pour le moment.')).toBeDefined())
  // Le message d'erreur brut du réseau ne doit jamais s'afficher tel quel.
  expect(screen.queryByText('panne réseau')).toBeNull()

  // L'onboarding se termine quand même, sans brief.
  await act(async () => void fireEvent.click(screen.getByText('Valider')))
  expect(onDone).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    null,
    null
  )
})

test('valider avant la fin de la génération n’attend pas le brief', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  mockedBrief.mockReturnValue(new Promise(() => {})) // ne répond jamais

  render(<Onboarding onDone={onDone} />)
  walkToRecap()

  // Le chargement est visible, mais Valider reste actionnable tout de suite.
  expect(screen.getByText(/prépare un mot/)).toBeDefined()
  await act(async () => void fireEvent.click(screen.getByText('Valider')))

  expect(onDone).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    null,
    null
  )
})

test('changer un chiffre après le récap régénère le brief', async () => {
  render(<Onboarding onDone={vi.fn()} />)
  walkToRecap()
  await waitFor(() => expect(mockedBrief).toHaveBeenCalledTimes(1))

  click('Retour') // sur « Ton objectif »
  click('Perte de gras')
  click('Continuer') // retour au récap, avec un objectif différent

  await waitFor(() => expect(mockedBrief).toHaveBeenCalledTimes(2))
})
