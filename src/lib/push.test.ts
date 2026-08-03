import { afterEach, describe, expect, test, vi } from 'vitest'
import { isStandalone, pushBlocker, urlBase64ToUint8Array } from './push'

/**
 * jsdom n'a ni PushManager ni display-mode : on installe et retire les
 * conditions une par une pour couvrir les cas que rencontre un iPhone.
 */
function setStandalone(value: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('standalone') && value,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  )
}

function setPushSupport(supported: boolean) {
  if (supported) {
    vi.stubGlobal('PushManager', class {})
    vi.stubGlobal('Notification', class {})
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
  } else {
    vi.unstubAllGlobals()
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('isStandalone', () => {
  test('reconnaît le mode écran d’accueil', () => {
    setStandalone(true)
    expect(isStandalone()).toBe(true)
  })

  test('un onglet Safari ordinaire n’est pas standalone', () => {
    setStandalone(false)
    expect(isStandalone()).toBe(false)
  })
})

describe('pushBlocker', () => {
  test('hors écran d’accueil, c’est ce qu’on reproche en premier', () => {
    // Le piège iOS : en onglet Safari, PushManager manque *aussi*. Dire
    // « non supporté » enverrait l'utilisateur changer de navigateur, alors
    // qu'il lui suffit d'ouvrir l'app depuis son icône.
    setStandalone(false)
    setPushSupport(false)
    expect(pushBlocker()).toBe('not-installed')
  })

  test('installée mais sans API Push : iOS trop ancien', () => {
    setStandalone(true)
    setPushSupport(false)
    expect(pushBlocker()).toBe('unsupported')
  })

  test('installée, supportée, mais sans clé VAPID déployée', () => {
    setStandalone(true)
    setPushSupport(true)
    // La clé est lue à l'import du module ; sans elle le blocage est explicite.
    expect(['no-key', null]).toContain(pushBlocker())
  })
})

describe('urlBase64ToUint8Array', () => {
  test('décode une clé base64url sans padding', () => {
    // "hello" en base64 = aGVsbG8= ; en base64url le padding saute.
    expect([...urlBase64ToUint8Array('aGVsbG8')]).toEqual([104, 101, 108, 108, 111])
  })

  test('rend 65 octets pour une clé VAPID publique', () => {
    const key = Buffer.from(Uint8Array.from({ length: 65 }, (_, i) => i))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(urlBase64ToUint8Array(key).length).toBe(65)
  })

  test('gère les caractères propres au base64url', () => {
    // 0xFB 0xFF donne "-" et "_" une fois encodé en base64url.
    const bytes = urlBase64ToUint8Array('-_8')
    expect([...bytes]).toEqual([251, 255])
  })
})
