import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { AddSheet } from './AddSheet'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  vi.unstubAllGlobals()
})

function renderSheet(onAdd = vi.fn().mockResolvedValue(true)) {
  const onClose = vi.fn()
  const view = render(
    <AddSheet
      favorites={[]}
      recents={[]}
      onClose={onClose}
      onAdd={onAdd}
      onSaveFavorite={vi.fn().mockResolvedValue(undefined)}
      onRemoveFavorite={vi.fn().mockResolvedValue(undefined)}
    />
  )
  return { ...view, onClose, onAdd }
}

/**
 * Le scénario du freeze : ouvrir l'ajout, passer à la recherche, puis tout
 * refermer. Les deux feuilles verrouillent le scroll du corps ; il doit être
 * rendu une fois la dernière fermée.
 */
test('fermer la recherche depuis la feuille d’ajout rend le scroll', () => {
  const { unmount } = renderSheet()
  expect(document.body.style.overflow).toBe('hidden')

  act(() => void fireEvent.click(screen.getByText('Rechercher un aliment')))
  // La feuille de recherche a bien pris la place de la feuille d'ajout.
  expect(screen.getByPlaceholderText(/Skyr/)).toBeDefined()
  expect(document.body.style.overflow).toBe('hidden')

  act(() => unmount())
  expect(document.body.style.overflow).toBe('')
})

test('l’ajout par un raccourci passe le repas suggéré par l’heure', async () => {
  // 9 h : le petit-déj doit être présélectionné.
  vi.setSystemTime(new Date('2026-08-03T09:00:00'))
  const { onAdd } = renderSheet()

  const preset = screen.getAllByRole('button').find((b) => b.textContent?.includes('kcal'))
  await act(async () => void fireEvent.click(preset!))

  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ meal_type: 'petit_dej' }))
  vi.useRealTimers()
})

test('changer de repas retague les ajouts suivants', async () => {
  vi.setSystemTime(new Date('2026-08-03T09:00:00'))
  const { onAdd } = renderSheet()

  act(() => void fireEvent.click(screen.getByText('Dîner')))
  const preset = screen.getAllByRole('button').find((b) => b.textContent?.includes('kcal'))
  await act(async () => void fireEvent.click(preset!))

  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ meal_type: 'diner' }))
  vi.useRealTimers()
})
