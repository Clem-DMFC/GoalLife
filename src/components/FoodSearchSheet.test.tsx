import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { FoodSearchSheet } from './FoodSearchSheet'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  vi.unstubAllGlobals()
})

function setup(onAdd = vi.fn().mockResolvedValue(true)) {
  const onClose = vi.fn()
  const onSaveFavorite = vi.fn().mockResolvedValue(undefined)
  render(
    <FoodSearchSheet
      meal="dejeuner"
      onMealChange={() => {}}
      onClose={onClose}
      onAdd={onAdd}
      onSaveFavorite={onSaveFavorite}
    />
  )
  const type = (value: string) =>
    act(() => void fireEvent.change(screen.getByPlaceholderText(/Skyr/), { target: { value } }))
  return { onAdd, onClose, type }
}

/**
 * Les quatre recherches manuelles demandées : œuf, riz, poulet, pâtes (avec
 * variantes de casse/accents). Un réseau qui ne répond jamais simule OFF
 * indisponible — les résultats doivent tout de même apparaître, sans erreur.
 */
;[
  ['œuf', 'Œuf entier, cru'],
  ['OEUF', 'Œuf entier, cru'],
  ['riz', 'Riz blanc, cru'],
  ['RIZ', 'Riz blanc, cru'],
  ['poulet', 'Poulet, filet, cru'],
  ['pâtes', 'Pâtes, cuites'],
  ['pates', 'Pâtes, cuites'],
].forEach(([query, expected]) => {
  test(`« ${query} » renvoie un résultat fiable de la base locale, instantanément`, () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))) // OFF ne répond jamais
    const { type } = setup()

    type(query)

    // Aucune attente : la base locale n'est pas débouncée.
    expect(screen.getByText(expected)).toBeDefined()
    expect(screen.queryByText(/injoignable|indisponible|répondu/)).toBeNull()
  })
})

test('chaque résultat de la base locale porte le badge "Base"', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { type } = setup()
  type('riz')

  const badges = screen.getAllByText('Base')
  expect(badges.length).toBeGreaterThanOrEqual(2) // riz cru + riz cuit, au moins
})

test('choisir un résultat local ouvre le détail avec les macros pour 100 g', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { type } = setup()
  type('poulet')

  act(() => void fireEvent.click(screen.getByText('Poulet, filet, cru')))

  expect(screen.getByText('120 kcal / 100 g')).toBeDefined()
  expect(screen.getByLabelText('Quantité (g)')).toBeDefined()
})

test('ajouter un aliment de la base locale au jour fonctionne comme un aliment OFF', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { type, onAdd } = setup()
  type('poulet')
  act(() => void fireEvent.click(screen.getByText('Poulet, filet, cru')))

  await act(async () => void fireEvent.click(screen.getByText('Ajouter')))

  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Poulet, filet, cru', kcal: 120, protein: 22 })
  )
})

test('un terme absent de la base locale et introuvable sur OFF affiche l’erreur', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  const { type } = setup()
  type('xyzzyxyzzy')

  await act(async () => await new Promise((r) => setTimeout(r, 600)))

  expect(screen.getByText(/injoignable/)).toBeDefined()
}, 3000)
