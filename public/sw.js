/*
 * Service worker minimaliste.
 * - navigations : network-first, fallback sur la coquille en cache (mode avion)
 * - assets statiques same-origin : cache-first (les noms sont hashés par Vite)
 * - tout le reste (API Supabase) : réseau direct, jamais de cache
 */
// Version bumpée à l'ajout du Web Push : force le remplacement du worker
// installé et la purge de l'ancienne coquille.
const CACHE = 'goallife-v2'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

/*
 * Web Push. iOS ne sait pas programmer une notification locale dans une PWA :
 * c'est le serveur qui pousse, à l'heure dite, et le service worker qui
 * l'affiche — y compris quand l'app est fermée.
 */
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // Charge utile illisible : on affiche quand même quelque chose, une
    // notification muette serait pire qu'un titre générique.
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Goatly'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // `tag` remplace une notification du même créneau au lieu de l'empiler.
      tag: payload.tag || 'goatly',
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // App déjà ouverte : on la ramène au premier plan et on la navigue,
      // plutôt que d'empiler une seconde fenêtre.
      for (const client of clients) {
        if (new URL(client.url).origin !== target.origin) continue
        if ('navigate' in client) {
          return client.navigate(target.href).then((c) => (c || client).focus())
        }
        return client.focus()
      }
      return self.clients.openWindow(target.href)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error()))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
    })
  )
})
