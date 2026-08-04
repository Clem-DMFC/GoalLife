import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { InstallTutorial } from './InstallTutorial'

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const IOS_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1'

function setUA(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

afterEach(() => {
  // Le hook garde l'event `beforeinstallprompt` capturé en variable de module :
  // le réinitialiser (tant que le composant est encore monté et écoute) pour
  // ne pas polluer les tests suivants.
  window.dispatchEvent(new Event('appinstalled'))
  cleanup()
  setUA(navigator.userAgent)
})

test('Android : bouton direct quand beforeinstallprompt est capturé', () => {
  setUA(ANDROID_UA)
  render(<InstallTutorial onContinue={() => {}} />)

  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  window.dispatchEvent(event)

  expect(screen.getByText("Installer l'application")).toBeDefined()
})

test('Android : instructions manuelles sans beforeinstallprompt', () => {
  setUA(ANDROID_UA)
  render(<InstallTutorial onContinue={() => {}} />)

  expect(screen.getByText(/Installer l'application/)).toBeDefined()
  expect(screen.queryByRole('button', { name: "Installer l'application" })).toBeNull()
})

test('iOS Safari : tuto visuel en 3 étapes', () => {
  setUA(IOS_SAFARI_UA)
  render(<InstallTutorial onContinue={() => {}} />)

  expect(screen.getByText('Appuie sur Partager')).toBeDefined()
  expect(screen.getByText("Choisis \"Sur l'écran d'accueil\"")).toBeDefined()
  expect(screen.getByText('Confirme avec "Ajouter"')).toBeDefined()
})

test('iOS hors Safari : renvoie vers Safari', () => {
  setUA(IOS_CHROME_UA)
  render(<InstallTutorial onContinue={() => {}} />)

  expect(screen.getByText(/Ouvre cette page dans/)).toBeDefined()
  expect(screen.queryByText('Appuie sur Partager')).toBeNull()
})

test('« Continuer sans installer » déclenche le callback', () => {
  setUA(ANDROID_UA)
  const onContinue = vi.fn()
  render(<InstallTutorial onContinue={onContinue} />)

  fireEvent.click(screen.getByText('Continuer sans installer'))
  expect(onContinue).toHaveBeenCalledOnce()
})
