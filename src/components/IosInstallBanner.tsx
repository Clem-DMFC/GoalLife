import { useEffect, useState } from 'react'

const DISMISS_KEY = 'goallife.iosInstallDismissed'

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ se déclare "Macintosh" mais expose le tactile.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!iOS) return false
  // Exclut Chrome / Firefox / Edge sur iOS : ils n'ont pas "Ajouter à l'écran d'accueil".
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Propriété non standard, propre à Safari iOS.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Explique "Ajouter à l'écran d'accueil" — uniquement sur Safari iOS non installé. */
export function IosInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    if (isIosSafari() && !isStandalone()) setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="card flex items-start gap-3 border border-protein/20 bg-protein/[0.06]">
      <span className="text-lg leading-none">📲</span>
      <div className="flex-1 text-[13px] leading-snug">
        <p className="font-semibold">Installe l'app sur ton iPhone</p>
        <p className="mt-0.5 text-black/60">
          Dans Safari : bouton <strong>Partager</strong> (le carré avec la flèche) →{' '}
          <strong>Sur l'écran d'accueil</strong>. L'app s'ouvrira en plein écran, sans barre
          Safari.
        </p>
      </div>
      <button
        type="button"
        aria-label="Masquer"
        className="tap -mt-1 -mr-1 flex w-9 items-center justify-center rounded-lg text-black/30"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1')
          setShow(false)
        }}
      >
        ✕
      </button>
    </div>
  )
}
