import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { IdentityCard } from './IdentityCard'
import { ToastProvider } from './Toaster'
import type { Identity } from '../lib/types'

/*
 * `vi.hoisted` : la fabrique de `vi.mock` est remontée en tête de fichier,
 * avant l'initialisation des `const`. Sans ça, elle référence des variables
 * qui n'existent pas encore.
 */
const { uploadAvatar, removeAvatar } = vi.hoisted(() => ({
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
}))

vi.mock('../lib/avatar', async () => {
  const actual = await vi.importActual<typeof import('../lib/avatar')>('../lib/avatar')
  return { ...actual, uploadAvatar, removeAvatar }
})

afterEach(() => {
  cleanup()
  uploadAvatar.mockReset()
  removeAvatar.mockReset()
})

const EMPTY: Identity = { first_name: null, avatar_url: null }

function setup(identity: Identity = EMPTY) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  render(
    <ToastProvider>
      <IdentityCard
        identity={identity}
        email="esteves.clementin@gmail.com"
        userId="u1"
        onSave={onSave}
      />
    </ToastProvider>
  )
  return { onSave }
}

test('sans prénom ni photo, l’initiale vient de l’email', () => {
  setup()
  expect(screen.getByText('Sans prénom')).toBeDefined()
  expect(screen.getByText('esteves.clementin@gmail.com')).toBeDefined()
  expect(screen.getByText('E')).toBeDefined()
})

test('le prénom donne l’initiale et remplace le libellé vide', () => {
  setup({ first_name: 'Clément', avatar_url: null })
  expect(screen.getByText('Clément')).toBeDefined()
  expect(screen.getByText('C')).toBeDefined()
})

test('une photo remplace l’initiale', () => {
  setup({ first_name: 'Clément', avatar_url: 'https://x/a.jpg?v=1' })
  expect(screen.getByRole('presentation').getAttribute('src')).toBe('https://x/a.jpg?v=1')
  expect(screen.queryByText('C')).toBeNull()
})

test('une photo cassée retombe sur l’initiale', () => {
  setup({ first_name: 'Clément', avatar_url: 'https://x/supprimee.jpg' })
  // Une photo effacée du stockage ne doit pas laisser un carré vide.
  act(() => void fireEvent.error(screen.getByRole('presentation')))
  expect(screen.getByText('C')).toBeDefined()
})

test('modifier puis enregistrer le prénom le remonte nettoyé', async () => {
  const { onSave } = setup()
  act(() => void fireEvent.click(screen.getByText('Modifier')))
  act(() =>
    void fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: '  Clément  ' } })
  )
  await act(async () => void fireEvent.click(screen.getByText('Enregistrer')))

  expect(onSave).toHaveBeenCalledWith({ first_name: 'Clément' })
})

test('un prénom vidé est enregistré comme absent, pas comme chaîne vide', async () => {
  const { onSave } = setup({ first_name: 'Clément', avatar_url: null })
  act(() => void fireEvent.click(screen.getByText('Modifier')))
  act(() => void fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: '   ' } }))
  await act(async () => void fireEvent.click(screen.getByText('Enregistrer')))

  expect(onSave).toHaveBeenCalledWith({ first_name: null })
})

test('annuler l’édition ne touche à rien', () => {
  const { onSave } = setup({ first_name: 'Clément', avatar_url: null })
  act(() => void fireEvent.click(screen.getByText('Modifier')))
  act(() => void fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Zoé' } }))
  act(() => void fireEvent.click(screen.getByText('Annuler')))

  expect(onSave).not.toHaveBeenCalled()
  expect(screen.getByText('Clément')).toBeDefined()
})

test('choisir une photo l’envoie et enregistre son URL', async () => {
  uploadAvatar.mockResolvedValue('https://x/a.jpg?v=9')
  const { onSave } = setup()

  const input = document.querySelector('input[type=file]') as HTMLInputElement
  const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
  await act(async () => void fireEvent.change(input, { target: { files: [file] } }))

  expect(uploadAvatar).toHaveBeenCalledWith('u1', file)
  expect(onSave).toHaveBeenCalledWith({ avatar_url: 'https://x/a.jpg?v=9' })
  await waitFor(() => expect(screen.getByText('Photo mise à jour')).toBeDefined())
})

test('un envoi raté le dit et n’enregistre rien', async () => {
  uploadAvatar.mockRejectedValue(new Error('Image trop lourde (12 Mo maximum).'))
  const { onSave } = setup()

  const input = document.querySelector('input[type=file]') as HTMLInputElement
  await act(
    async () =>
      void fireEvent.change(input, {
        target: { files: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })] },
      })
  )

  expect(onSave).not.toHaveBeenCalled()
  await waitFor(() => expect(screen.getByText(/12 Mo maximum/)).toBeDefined())
})

test('retirer la photo vide la colonne puis le stockage', async () => {
  removeAvatar.mockResolvedValue(undefined)
  const { onSave } = setup({ first_name: 'Clément', avatar_url: 'https://x/a.jpg' })

  await act(async () => void fireEvent.click(screen.getByText('Retirer la photo')))

  expect(onSave).toHaveBeenCalledWith({ avatar_url: null })
  expect(removeAvatar).toHaveBeenCalledWith('u1')
})

test('sans photo, il n’y a rien à retirer', () => {
  setup()
  expect(screen.queryByText('Retirer la photo')).toBeNull()
})
