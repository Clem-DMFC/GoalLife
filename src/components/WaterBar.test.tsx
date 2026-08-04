import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { WaterBar } from './WaterBar'

afterEach(cleanup)

const noop = async () => {}

function setup(props: Partial<Parameters<typeof WaterBar>[0]> = {}) {
  const onAdd = vi.fn().mockResolvedValue(undefined)
  render(
    <WaterBar
      ml={1250}
      target={3000}
      canUndo
      onAdd={onAdd}
      onUndo={noop}
      onReset={noop}
      {...props}
    />
  )
  return { onAdd }
}

test('affiche le total, l’objectif et ce qu’il reste', () => {
  setup()
  expect(screen.getByText('1.3 L')).toBeDefined()
  expect(screen.getByText(/objectif 3 L/)).toBeDefined()
  expect(screen.getByText(/42 %/)).toBeDefined()
  expect(screen.getByText('1.8 L restants')).toBeDefined()
})

test('les trois contenants envoient bien leur volume', async () => {
  const { onAdd } = setup()
  await act(async () => void fireEvent.click(screen.getByText('+500')))
  expect(onAdd).toHaveBeenCalledWith(500)
})

test('objectif atteint : plus de « restants », et la remise à zéro reste offerte', () => {
  setup({ ml: 3000 })
  expect(screen.getByText(/Objectif atteint/)).toBeDefined()
  expect(screen.queryByText(/restants/)).toBeNull()
  expect(screen.getByText('Remettre à zéro').hasAttribute('disabled')).toBe(false)
})

test('à zéro, il n’y a rien à remettre à zéro', () => {
  setup({ ml: 0, canUndo: false })
  expect(screen.getByText('Remettre à zéro').hasAttribute('disabled')).toBe(true)
  expect(screen.getByText('Annuler le dernier').hasAttribute('disabled')).toBe(true)
})

test('un objectif à zéro ne produit pas de pourcentage absurde', () => {
  setup({ ml: 500, target: 0 })
  expect(screen.getByText(/0 %/)).toBeDefined()
})
