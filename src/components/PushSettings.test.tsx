import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { PushSettings } from './PushSettings'
import { ToastProvider } from './Toaster'

vi.mock('../lib/push', async () => {
  const actual = await vi.importActual<typeof import('../lib/push')>('../lib/push')
  return {
    ...actual,
    pushBlocker: vi.fn(() => 'not-installed' as const),
    currentSubscription: vi.fn().mockResolvedValue(null),
  }
})

const push = await import('../lib/push')

afterEach(cleanup)

function setup() {
  render(
    <ToastProvider>
      <PushSettings />
    </ToastProvider>
  )
}

test('en onglet Safari, l’interrupteur est bloqué avec la consigne utile', async () => {
  vi.mocked(push.pushBlocker).mockReturnValue('not-installed')
  setup()

  await waitFor(() =>
    expect(screen.getByText(/icône de l'écran d'accueil/)).toBeDefined()
  )
  expect(screen.getByRole('switch').hasAttribute('disabled')).toBe(true)
})

test('sur un iOS trop ancien, le message parle de mise à jour', async () => {
  vi.mocked(push.pushBlocker).mockReturnValue('unsupported')
  setup()

  await waitFor(() => expect(screen.getByText(/iOS 16.4/)).toBeDefined())
})

test('sans blocage et sans abonnement, l’interrupteur est proposé éteint', async () => {
  vi.mocked(push.pushBlocker).mockReturnValue(null)
  vi.mocked(push.currentSubscription).mockResolvedValue(null)
  setup()

  await waitFor(() => {
    const toggle = screen.getByRole('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    expect(toggle.hasAttribute('disabled')).toBe(false)
  })
  // Le bouton de test n'a pas de sens tant qu'on n'est pas abonné.
  expect(screen.queryByText('Envoyer une notif de test')).toBeNull()
})

test('abonné, le planning et le bouton de test apparaissent', async () => {
  vi.mocked(push.pushBlocker).mockReturnValue(null)
  vi.mocked(push.currentSubscription).mockResolvedValue({
    endpoint: 'https://push.apple.com/x',
  } as PushSubscription)
  setup()

  await waitFor(() => expect(screen.getByText('Envoyer une notif de test')).toBeDefined())
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
  expect(screen.getByText('07:25')).toBeDefined()
  expect(screen.getByText('Pesée du matin')).toBeDefined()
})
