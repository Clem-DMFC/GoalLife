import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { MealSections } from './MealSections'
import type { FoodEntry, MealType } from '../lib/types'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const entry = (id: string, name: string, meal: MealType | null, kcal: number, protein: number) =>
  ({
    id,
    user_id: 'u',
    day: '2026-08-04',
    name,
    kcal,
    protein,
    carbs: 20,
    fat: 5,
    meal_type: meal,
    created_at: '2026-08-04T08:00:00Z',
  }) as FoodEntry

const ENTRIES = [
  entry('1', 'Skyr nature', 'petit_dej', 120, 20),
  entry('2', 'Flocons d’avoine', 'petit_dej', 122, 4),
  entry('3', 'Poulet riz brocolis', 'dejeuner', 620, 48),
  entry('4', 'Saumon patate douce', 'diner', 700, 39),
]

function setup(entries = ENTRIES) {
  const onCopy = vi.fn().mockResolvedValue(undefined)
  const onRemove = vi.fn().mockResolvedValue(undefined)
  render(
    <MealSections
      entries={entries}
      onRemove={onRemove}
      onCopy={onCopy}
      copyLabel="Dupliquer le repas"
    />
  )
  return { onCopy, onRemove }
}

beforeEach(() => {
  // 12 h 30 : le déjeuner est le repas de l'heure courante.
  vi.setSystemTime(new Date('2026-08-04T12:30:00'))
})

test('chaque repas montre son sous-total, même replié', () => {
  setup()
  // On lit les en-têtes, pas les aliments : « 620 kcal » figure aussi sur la
  // ligne du plat, dans le repas ouvert.
  const header = (label: string) => screen.getByText(label).closest('button')!.textContent
  expect(header('Petit-déj')).toContain('242 kcal') // 120 + 122
  expect(header('Petit-déj')).toContain('24P')
  expect(header('Déjeuner')).toContain('620 kcal')
  expect(header('Dîner')).toContain('700 kcal')
})

test('seul le repas de l’heure courante est déplié', () => {
  setup()
  // Déjeuner ouvert : son aliment est visible.
  expect(screen.getByText('Poulet riz brocolis')).toBeDefined()
  // Les autres sont repliés.
  expect(screen.queryByText('Skyr nature')).toBeNull()
  expect(screen.queryByText('Saumon patate douce')).toBeNull()
})

test('à l’heure du dîner, c’est le dîner qui s’ouvre', () => {
  vi.setSystemTime(new Date('2026-08-04T19:30:00'))
  setup()
  expect(screen.getByText('Saumon patate douce')).toBeDefined()
  expect(screen.queryByText('Poulet riz brocolis')).toBeNull()
})

test('un tap déplie, un autre replie', () => {
  setup()
  const header = screen.getByText('Petit-déj').closest('button')!

  act(() => void fireEvent.click(header))
  expect(screen.getByText('Skyr nature')).toBeDefined()
  expect(header.getAttribute('aria-expanded')).toBe('true')

  act(() => void fireEvent.click(header))
  expect(screen.queryByText('Skyr nature')).toBeNull()
  expect(header.getAttribute('aria-expanded')).toBe('false')
})

test('replier le repas ouvert par défaut le referme bien', () => {
  setup()
  const header = screen.getByText('Déjeuner').closest('button')!
  expect(header.getAttribute('aria-expanded')).toBe('true')

  act(() => void fireEvent.click(header))
  expect(screen.queryByText('Poulet riz brocolis')).toBeNull()
})

test('la copie n’apparaît que sur un repas ouvert', () => {
  const { onCopy } = setup()
  // Un seul repas ouvert, donc un seul bouton de copie.
  const copies = screen.getAllByLabelText(/Dupliquer le repas/)
  expect(copies).toHaveLength(1)
  expect(copies[0].getAttribute('aria-label')).toContain('Déjeuner')

  act(() => void fireEvent.click(copies[0]))
  expect(onCopy).toHaveBeenCalledWith([ENTRIES[2]])
})

test('supprimer un aliment reste possible depuis le repas ouvert', () => {
  const { onRemove } = setup()
  act(() => void fireEvent.click(screen.getByLabelText('Supprimer Poulet riz brocolis')))
  expect(onRemove).toHaveBeenCalledWith('3')
})

test('les entrées non classées tombent dans « Autre »', () => {
  setup([entry('9', 'Café', null, 5, 0)])
  expect(screen.getByText('Autre')).toBeDefined()
})

test('un jour sans entrée le dit', () => {
  setup([])
  expect(screen.getByText('Aucune entrée pour ce jour.')).toBeDefined()
})
