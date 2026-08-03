import { useCallback, useEffect, useState } from 'react'
import {
  currentSubscription,
  disablePush,
  enablePush,
  pushBlocker,
  sendTestPush,
  type PushBlocker,
} from '../lib/push'

/** État de l'interrupteur « Activer les rappels ». */
export function usePush() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [blocker, setBlocker] = useState<PushBlocker | null>(null)

  useEffect(() => {
    let alive = true
    setBlocker(pushBlocker())
    currentSubscription()
      .then((sub) => {
        if (alive) setEnabled(sub !== null)
      })
      .catch(() => {
        /* Pas d'abonnement lisible : l'interrupteur reste éteint. */
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  /** Renvoie l'erreur à afficher, ou `null` si tout s'est bien passé. */
  const toggle = useCallback(async (): Promise<string | null> => {
    if (busy) return null
    setBusy(true)
    try {
      if (enabled) {
        await disablePush()
        setEnabled(false)
      } else {
        await enablePush()
        setEnabled(true)
      }
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Impossible de changer les rappels.'
    } finally {
      setBusy(false)
      setBlocker(pushBlocker())
    }
  }, [busy, enabled])

  const test = useCallback(async (): Promise<string | null> => {
    if (busy) return null
    setBusy(true)
    try {
      await sendTestPush()
      return null
    } catch (err) {
      return err instanceof Error ? err.message : "L'envoi de test a échoué."
    } finally {
      setBusy(false)
    }
  }, [busy])

  return { enabled, loading, busy, blocker, toggle, test }
}
