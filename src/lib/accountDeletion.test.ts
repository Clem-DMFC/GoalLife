import { expect, test, vi } from 'vitest'

const invoke = vi.fn()

vi.mock('./supabase', () => ({
  supabase: { functions: { invoke } },
}))

const { AccountDeletionError, deleteAccount } = await import('./accountDeletion')

test('appelle la fonction delete-account', async () => {
  invoke.mockResolvedValue({ data: { deleted: true }, error: null })
  await deleteAccount()
  expect(invoke).toHaveBeenCalledWith('delete-account')
})

test('une erreur de la fonction devient une AccountDeletionError lisible', async () => {
  invoke.mockResolvedValue({ data: null, error: { message: 'panne' } })
  await expect(deleteAccount()).rejects.toThrow(AccountDeletionError)
  await expect(deleteAccount()).rejects.toThrow('panne')
})
