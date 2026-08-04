import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Auth } from './Auth'

const signInWithOtp = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { signInWithOtp: (...args: unknown[]) => signInWithOtp(...args) } },
}))

const CONSENT_KEY = 'goallife.consentGiven'

beforeEach(() => {
  localStorage.clear()
  signInWithOtp.mockReset().mockResolvedValue({ error: null })
})

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

test('sans consentement, l’envoi du code est bloqué', () => {
  render(<Auth />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })

  expect(screen.getByText('Recevoir un code').hasAttribute('disabled')).toBe(true)
})

test('cocher la case débloque l’envoi, et le consentement est retenu', async () => {
  render(<Auth />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
  fireEvent.click(screen.getByRole('checkbox'))

  expect(screen.getByText('Recevoir un code').hasAttribute('disabled')).toBe(false)

  await act(async () => void fireEvent.click(screen.getByText('Recevoir un code')))

  expect(signInWithOtp).toHaveBeenCalledWith({
    email: 'a@b.com',
    options: { shouldCreateUser: true },
  })
  expect(localStorage.getItem(CONSENT_KEY)).toBe('1')
})

test('un consentement déjà donné sur cet appareil n’est pas redemandé', () => {
  localStorage.setItem(CONSENT_KEY, '1')
  render(<Auth />)

  expect(screen.getByRole('checkbox')).toHaveProperty('checked', true)
})

test('le lien ouvre la politique de confidentialité, fermable', () => {
  render(<Auth />)
  fireEvent.click(screen.getByText('politique de confidentialité'))

  expect(screen.getByText('Confidentialité')).toBeDefined()
  fireEvent.click(screen.getByLabelText('Fermer'))
  expect(screen.queryByText('Confidentialité')).toBeNull()
})
