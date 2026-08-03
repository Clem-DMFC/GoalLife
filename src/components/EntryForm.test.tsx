import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { EntryForm } from './EntryForm'

afterEach(cleanup)

function fill() {
  fireEvent.change(screen.getByLabelText('Aliment'), { target: { value: 'Pâtes bolo' } })
  fireEvent.change(screen.getByLabelText('kcal'), { target: { value: '520' } })
}

test('un ajout réussi vide le formulaire', async () => {
  const onAdd = vi.fn().mockResolvedValue(true)
  render(<EntryForm variant="tab" onAdd={onAdd} />)

  fill()
  await act(async () => void fireEvent.click(screen.getByText('Ajouter')))

  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Pâtes bolo', kcal: 520 })
  )
  expect((screen.getByLabelText('Aliment') as HTMLInputElement).value).toBe('')
})

test('un ajout raté garde la saisie à l’écran', async () => {
  const onAdd = vi.fn().mockResolvedValue(false)
  render(<EntryForm variant="tab" onAdd={onAdd} />)

  fill()
  await act(async () => void fireEvent.click(screen.getByText('Ajouter')))

  // Rien à retaper : le nom et les macros sont toujours là.
  expect((screen.getByLabelText('Aliment') as HTMLInputElement).value).toBe('Pâtes bolo')
  expect((screen.getByLabelText('kcal') as HTMLInputElement).value).toBe('520')
})
