import { render, screen, act, cleanup } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ToastProvider, useToast } from './Toaster'

afterEach(cleanup)

function Trigger() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.success('Skyr ajouté au petit-déj')}>ok</button>
      <button onClick={() => toast.error('Échec réseau')}>ko</button>
    </>
  )
}

test('un ajout réussi affiche un message qui disparaît seul', () => {
  vi.useFakeTimers()
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  )

  act(() => screen.getByText('ok').click())
  expect(screen.getByText('Skyr ajouté au petit-déj')).toBeDefined()

  act(() => void vi.advanceTimersByTime(2500))
  expect(screen.queryByText('Skyr ajouté au petit-déj')).toBeNull()
  vi.useRealTimers()
})

test('un échec affiche un message d’erreur, qui reste plus longtemps', () => {
  vi.useFakeTimers()
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  )

  act(() => screen.getByText('ko').click())
  expect(screen.getByText('Échec réseau')).toBeDefined()

  // Toujours là quand un message de succès aurait déjà disparu.
  act(() => void vi.advanceTimersByTime(2500))
  expect(screen.getByText('Échec réseau')).toBeDefined()

  act(() => void vi.advanceTimersByTime(2500))
  expect(screen.queryByText('Échec réseau')).toBeNull()
  vi.useRealTimers()
})

test('hors provider, demander un toast ne fait pas planter', () => {
  render(<Trigger />)
  act(() => screen.getByText('ok').click())
  expect(screen.getByText('ok')).toBeDefined()
})
