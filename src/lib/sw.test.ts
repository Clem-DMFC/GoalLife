import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * Le service worker est du JavaScript brut, hors du bundle : ni TypeScript ni
 * le build ne le regardent. Une faute y est invisible jusqu'au jour où aucune
 * notification n'arrive. On charge donc le vrai fichier dans un faux scope de
 * worker et on déclenche les événements à la main.
 */

type Handler = (event: unknown) => void

function loadServiceWorker() {
  const source = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8')
  const handlers: Record<string, Handler> = {}

  const registration = { showNotification: vi.fn() }
  const clients = {
    matchAll: vi.fn().mockResolvedValue([]),
    openWindow: vi.fn().mockResolvedValue(undefined),
    claim: vi.fn(),
  }

  const self = {
    addEventListener: (type: string, fn: Handler) => {
      handlers[type] = fn
    },
    registration,
    clients,
    location: { origin: 'https://goatly.app' },
    skipWaiting: vi.fn(),
  }

  // `caches` et `fetch` ne servent qu'aux handlers d'installation et de
  // requête, que ces tests ne déclenchent pas.
  const caches = { open: vi.fn(), keys: vi.fn().mockResolvedValue([]), match: vi.fn() }

  new Function('self', 'caches', 'fetch', 'URL', 'Response', source)(
    self,
    caches,
    vi.fn(),
    URL,
    { error: vi.fn() }
  )

  return { handlers, registration, clients }
}

/** Un événement push porteur d'une charge JSON, comme en produit le serveur. */
function pushEvent(payload: unknown) {
  const waits: Promise<unknown>[] = []
  return {
    event: {
      data: { json: () => payload, text: () => JSON.stringify(payload) },
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    },
    waits,
  }
}

let sw: ReturnType<typeof loadServiceWorker>

beforeEach(() => {
  sw = loadServiceWorker()
})

describe('handler push', () => {
  test('affiche la notification envoyée par le serveur', async () => {
    const { event, waits } = pushEvent({
      title: '💧 Hydratation',
      body: "C'est l'heure de boire un verre d'eau.",
      url: '/?go=water',
      tag: 'water_morning',
    })

    sw.handlers.push(event)
    await Promise.all(waits)

    expect(sw.registration.showNotification).toHaveBeenCalledWith(
      '💧 Hydratation',
      expect.objectContaining({
        body: "C'est l'heure de boire un verre d'eau.",
        tag: 'water_morning',
        data: { url: '/?go=water' },
      })
    )
  })

  test('une charge illisible affiche quand même quelque chose', async () => {
    const waits: Promise<unknown>[] = []
    sw.handlers.push({
      data: {
        json: () => {
          throw new Error('pas du JSON')
        },
        text: () => 'coucou',
      },
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    })
    await Promise.all(waits)

    // Titre de repli plutôt qu'une notification muette, qui serait pire.
    expect(sw.registration.showNotification).toHaveBeenCalledWith(
      'Goatly',
      expect.objectContaining({ body: 'coucou' })
    )
  })

  test('un push sans données ne fait pas planter le worker', async () => {
    const waits: Promise<unknown>[] = []
    sw.handlers.push({ data: null, waitUntil: (p: Promise<unknown>) => waits.push(p) })
    await Promise.all(waits)
    expect(sw.registration.showNotification).toHaveBeenCalledWith('Goatly', expect.anything())
  })
})

describe('handler notificationclick', () => {
  function clickEvent(url: string) {
    const waits: Promise<unknown>[] = []
    const close = vi.fn()
    return {
      event: {
        notification: { close, data: { url } },
        waitUntil: (p: Promise<unknown>) => waits.push(p),
      },
      waits,
      close,
    }
  }

  test('ouvre une fenêtre sur le deep link quand l’app est fermée', async () => {
    const { event, waits, close } = clickEvent('/?go=add&meal=diner')
    sw.handlers.notificationclick(event)
    await Promise.all(waits)

    expect(close).toHaveBeenCalled()
    expect(sw.clients.openWindow).toHaveBeenCalledWith(
      'https://goatly.app/?go=add&meal=diner'
    )
  })

  test('réutilise et navigue la fenêtre déjà ouverte', async () => {
    const client = {
      url: 'https://goatly.app/',
      navigate: vi.fn().mockResolvedValue(null),
      focus: vi.fn(),
    }
    sw.clients.matchAll.mockResolvedValue([client])

    const { event, waits } = clickEvent('/?go=weight')
    sw.handlers.notificationclick(event)
    await Promise.all(waits)

    // Pas de seconde fenêtre empilée par-dessus l'app déjà lancée.
    expect(sw.clients.openWindow).not.toHaveBeenCalled()
    expect(client.navigate).toHaveBeenCalledWith('https://goatly.app/?go=weight')
    expect(client.focus).toHaveBeenCalled()
  })
})
