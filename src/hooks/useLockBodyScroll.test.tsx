import { render, screen, cleanup } from '@testing-library/react'
import { act } from 'react'
import { afterEach, expect, test } from 'vitest'
import { useLockBodyScroll } from './useLockBodyScroll'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

function Child() {
  useLockBodyScroll()
  return <div>enfant</div>
}

function Parent({ nested }: { nested: boolean }) {
  useLockBodyScroll()
  return nested ? <Child /> : <div>parent</div>
}

/**
 * Reproduction du freeze : la feuille d'ajout verrouille le scroll, puis la
 * feuille de recherche qu'elle rend le verrouille à son tour. À la fermeture
 * les deux se démontent ensemble, et le corps doit redevenir défilable.
 */
test('le scroll est rendu au corps quand deux feuilles imbriquées se ferment', () => {
  const { unmount, rerender } = render(<Parent nested={false} />)
  expect(document.body.style.overflow).toBe('hidden')

  // L'utilisateur tape « Rechercher un aliment » : la feuille de recherche
  // se monte à l'intérieur de la feuille d'ajout, déjà verrouillée.
  rerender(<Parent nested />)
  expect(screen.getByText('enfant')).toBeDefined()

  // Il ajoute un aliment : onClose ferme tout d'un coup.
  act(() => unmount())

  expect(document.body.style.overflow).toBe('')
})

test('une seule feuille rend le scroll à la fermeture', () => {
  const { unmount } = render(<Parent nested={false} />)
  expect(document.body.style.overflow).toBe('hidden')
  act(() => unmount())
  expect(document.body.style.overflow).toBe('')
})
