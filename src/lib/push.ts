import { supabase } from './supabase'

/**
 * Abonnement Web Push.
 *
 * iOS ne sait pas planifier une notification depuis la PWA : tout passe par un
 * serveur qui pousse à l'heure dite. Le navigateur ne fournit un abonnement
 * qu'à trois conditions, et les trois se vérifient avant de demander quoi que
 * ce soit à l'utilisateur.
 */

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** Pourquoi l'abonnement est impossible ici — ou `null` si tout va bien. */
export type PushBlocker = 'unsupported' | 'not-installed' | 'no-key'

/**
 * L'app tourne-t-elle depuis l'icône de l'écran d'accueil ?
 *
 * Sur iOS, le Web Push n'existe qu'en mode standalone : ouverte dans un onglet
 * Safari, `PushManager` est absent ou `subscribe()` échoue. Autant le dire
 * avant, avec une consigne actionnable.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true
}

export function pushBlocker(): PushBlocker | null {
  if (typeof window === 'undefined') return 'unsupported'
  const supported =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  // L'ordre compte : sur un iPhone en onglet Safari, `PushManager` manque
  // aussi. Dire « non supporté » enverrait l'utilisateur changer de navigateur
  // alors qu'il lui suffit d'ouvrir l'app depuis son icône.
  if (!isStandalone()) return 'not-installed'
  if (!supported) return 'unsupported'
  if (!VAPID_PUBLIC_KEY) return 'no-key'
  return null
}

export const BLOCKER_MESSAGE: Record<PushBlocker, string> = {
  'not-installed':
    "Ouvre l'app depuis l'icône de l'écran d'accueil pour activer les rappels.",
  unsupported:
    'Les rappels demandent iOS 16.4 ou plus récent. Mets ton iPhone à jour, puis réessaie.',
  'no-key':
    "Les rappels ne sont pas configurés sur ce déploiement (clé VAPID manquante).",
}

/**
 * base64url → octets, format attendu par `applicationServerKey`.
 * Adossé explicitement à un `ArrayBuffer` : `BufferSource` refuse un tableau
 * qui pourrait reposer sur un `SharedArrayBuffer`.
 */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** Les clés d'un abonnement, en base64url, telles que stockées en base. */
function subscriptionKeys(sub: PushSubscription): { p256dh: string; auth: string } {
  const json = sub.toJSON()
  const keys = json.keys ?? {}
  if (!keys.p256dh || !keys.auth) {
    throw new Error("L'abonnement push est incomplet.")
  }
  return { p256dh: keys.p256dh, auth: keys.auth }
}

async function registration(): Promise<ServiceWorkerRegistration> {
  // `ready` attend que le worker soit actif : s'abonner trop tôt échoue.
  return await navigator.serviceWorker.ready
}

/** L'abonnement courant du navigateur, s'il y en a un. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushBlocker() !== null) return null
  const reg = await registration()
  return await reg.pushManager.getSubscription()
}

/**
 * Demande la permission, s'abonne, et enregistre l'abonnement.
 *
 * À n'appeler que depuis un geste utilisateur : iOS refuse la demande de
 * permission déclenchée au chargement.
 */
export async function enablePush(): Promise<void> {
  const blocker = pushBlocker()
  if (blocker) throw new Error(BLOCKER_MESSAGE[blocker])

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications refusées. Réactive-les dans Réglages > Notifications > Goatly.'
        : 'Notifications non autorisées.'
    )
  }

  const reg = await registration()
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    }))

  const { p256dh, auth } = subscriptionKeys(sub)

  // `endpoint` est unique : réactiver depuis le même appareil met à jour la
  // ligne au lieu d'en empiler une nouvelle.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, p256dh, auth }, { onConflict: 'endpoint' })

  if (error) {
    // On ne laisse pas un abonnement navigateur orphelin derrière soi.
    await sub.unsubscribe().catch(() => {})
    throw new Error(error.message)
  }
}

/** Désabonne le navigateur et retire la ligne correspondante. */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return

  const endpoint = sub.endpoint
  await sub.unsubscribe().catch(() => {})
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) throw new Error(error.message)
}

/** Déclenche une notification immédiate, pour valider la chaîne complète. */
export async function sendTestPush(): Promise<void> {
  const { error } = await supabase.functions.invoke('send-reminders', {
    body: { test: true },
  })
  if (error) throw new Error(error.message)
}
