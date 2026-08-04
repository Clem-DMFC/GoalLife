import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { Onboarding } from './Onboarding'

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

test('la validation remonte le profil, les objectifs et le prénom', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  render(<Onboarding onDone={onDone} />)
  walkToRecap('Clément')

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
    'Clément'
  )
})

test('le prénom est facultatif : on peut passer l’écran', async () => {
  const onDone = vi.fn().mockResolvedValue(undefined)
  render(<Onboarding onDone={onDone} />)

  // Sans saisie, le bouton propose de passer plutôt que de continuer.
  expect(screen.getByText('Passer')).toBeDefined()
  walkToRecap()
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
