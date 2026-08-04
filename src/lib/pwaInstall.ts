export type Platform = 'ios' | 'android' | 'other'

export function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ se déclare "Macintosh" mais expose le tactile.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!iOS) return false
  // Exclut Chrome / Firefox / Edge sur iOS : ils n'ont pas "Ajouter à l'écran d'accueil".
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

export function isIos(): boolean {
  const ua = navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent)
}

export function getPlatform(): Platform {
  if (isIos()) return 'ios'
  if (isAndroid()) return 'android'
  return 'other'
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Propriété non standard, propre à Safari iOS.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
