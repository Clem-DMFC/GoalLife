import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { DaySummary } from './DaySummary'

afterEach(cleanup)

const TARGETS = { kcal: 2800, protein: 140, carbs: 390, fat: 78 }

test('les calories restantes sont l’information mise en avant', () => {
  render(<DaySummary totals={{ kcal: 1840, protein: 112, carbs: 190, fat: 61 }} targets={TARGETS} />)

  expect(screen.getByText('960')).toBeDefined()
  expect(screen.getByText('restantes')).toBeDefined()
  // Le détail consommé/objectif reste lisible, mais en second.
  expect(screen.getByText('1840 / 2800 kcal')).toBeDefined()
})

test('les trois macros affichent valeur, objectif et reste', () => {
  render(<DaySummary totals={{ kcal: 1840, protein: 112, carbs: 190, fat: 61 }} targets={TARGETS} />)

  for (const label of ['Protéines', 'Glucides', 'Lipides']) {
    expect(screen.getByText(label)).toBeDefined()
  }
  expect(screen.getByText('28 g restants')).toBeDefined() // 140 − 112
  expect(screen.getByText('200 g restants')).toBeDefined() // 390 − 190
  expect(screen.getByText('17 g restants')).toBeDefined() // 78 − 61
})

test('le dépassement calorique se lit sans ambiguïté', () => {
  render(<DaySummary totals={{ kcal: 3000, protein: 150, carbs: 400, fat: 80 }} targets={TARGETS} />)

  expect(screen.getByText('+200')).toBeDefined()
  expect(screen.getByText('en trop')).toBeDefined()
  expect(screen.queryByText('restantes')).toBeNull()
  // Idem sur les macros dépassées : protéines +10, glucides +10.
  expect(screen.getAllByText('+10 g')).toHaveLength(2)
})

test('une journée vide affiche l’objectif entier comme restant', () => {
  render(<DaySummary totals={{ kcal: 0, protein: 0, carbs: 0, fat: 0 }} targets={TARGETS} />)

  expect(screen.getByText('2800')).toBeDefined()
  expect(screen.getByText('0 / 2800 kcal')).toBeDefined()
  expect(screen.getByText('140 g restants')).toBeDefined()
})

test('un objectif à zéro ne fait pas diviser par zéro', () => {
  render(
    <DaySummary
      totals={{ kcal: 100, protein: 10, carbs: 10, fat: 10 }}
      targets={{ kcal: 0, protein: 0, carbs: 0, fat: 0 }}
    />
  )
  expect(screen.getByText('+100')).toBeDefined()
})
