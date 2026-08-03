import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { MacroSplit } from './MacroSplit'
import { EMPTY_TOTALS } from '../lib/types'

afterEach(cleanup)

test('affiche les grammes et les parts de chaque macro', () => {
  render(<MacroSplit totals={{ kcal: 0, protein: 10, carbs: 10, fat: 10 }} />)

  expect(screen.getByText('Protéines')).toBeDefined()
  // 40 + 40 + 90 kcal : les lipides pèsent plus que leur poids en grammes.
  expect(screen.getByText('170')).toBeDefined()
  // 24 + 23 + 53 : l'unité restante va au plus fort reste, jamais à 99 %.
  expect(screen.getByText('53 %')).toBeDefined()
  expect(screen.getByText('24 %')).toBeDefined()
  expect(screen.getByText('23 %')).toBeDefined()
})

test('une journée vide n’invente ni total ni pourcentage', () => {
  render(<MacroSplit totals={EMPTY_TOTALS} />)
  // Un tiret pour le total, un par macro.
  expect(screen.getAllByText('—')).toHaveLength(4)
})
