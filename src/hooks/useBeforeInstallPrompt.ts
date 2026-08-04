import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Chrome/Android ne redéclenchera pas `beforeinstallprompt` après le premier
 * envoi : l'event capturé doit être conservé tant que la page vit, y compris
 * si le composant qui l'utilise démonte puis remonte (feuille de tuto rouverte
 * depuis les réglages).
 */
let capturedEvent: BeforeInstallPromptEvent | null = null

export function useBeforeInstallPrompt() {
  const [canInstall, setCanInstall] = useState(capturedEvent !== null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      capturedEvent = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      capturedEvent = null
      setCanInstall(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!capturedEvent) return 'unavailable'
    await capturedEvent.prompt()
    const { outcome } = await capturedEvent.userChoice
    capturedEvent = null
    setCanInstall(false)
    return outcome
  }

  return { canInstall, promptInstall }
}
