import { useState } from 'react'
import { Logo } from './Logo'
import { useBeforeInstallPrompt } from '../hooks/useBeforeInstallPrompt'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { getPlatform, isIosSafari } from '../lib/pwaInstall'

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={2}>
        <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="5" y="10" width="14" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Appuie sur Partager',
    body: "En bas de Safari, le bouton carré avec la flèche vers le haut.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={2}>
        <rect x="4" y="4" width="16" height="16" rx="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9v6M9 12h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Choisis "Sur l\'écran d\'accueil"',
    body: 'Fais défiler la liste des options jusqu\'à la trouver.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={2}>
        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Confirme avec "Ajouter"',
    body: "L'app apparaît sur ton écran d'accueil, prête à s'ouvrir en plein écran.",
  },
]

function IosSteps() {
  return (
    <ol className="space-y-2.5">
      {STEPS.map((s, i) => (
        <li key={s.title} className="card flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            {s.icon}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-ink/35">{i + 1}</span>
              <span className="text-sm font-semibold">{s.title}</span>
            </div>
            <p className="mt-0.5 text-[13px] leading-snug text-ink/60">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function AndroidInstall() {
  const { canInstall, promptInstall } = useBeforeInstallPrompt()
  const [busy, setBusy] = useState(false)
  const [refused, setRefused] = useState(false)

  if (!canInstall) {
    return (
      <div className="card text-[13px] leading-snug text-ink/60">
        Ouvre le menu <strong>⋮</strong> en haut à droite de Chrome, puis choisis{' '}
        <strong>Installer l'application</strong> (ou « Ajouter à l'écran d'accueil »).
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primary w-full py-3.5 text-[15px]"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const outcome = await promptInstall()
          setBusy(false)
          if (outcome === 'dismissed') setRefused(true)
        }}
      >
        Installer l'application
      </button>
      {refused && (
        <p className="px-1 text-[12px] text-ink/45">
          Tu pourras réessayer plus tard depuis les réglages.
        </p>
      )}
    </div>
  )
}

/**
 * Écran d'aide à l'installation, adapté à la plateforme. Utilisé plein écran
 * avant l'inscription, et en feuille fermable depuis les réglages.
 */
export function InstallTutorial({
  onContinue,
  onClose,
}: {
  /** Pré-inscription : "continuer sans installer". Absent en mode feuille. */
  onContinue?: () => void
  /** Depuis les réglages : ferme la feuille. Absent en mode pré-inscription. */
  onClose?: () => void
}) {
  useLockBodyScroll()
  const platform = getPlatform()
  const iosSafari = platform === 'ios' && isIosSafari()

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 px-4 py-3">
        <Logo size={20} className="text-protein" />
        <h1 className="flex-1 text-lg font-semibold">Installer l'app</h1>
        {onClose && (
          <button
            type="button"
            className="tap flex w-11 items-center justify-center rounded-xl bg-surface text-ink/40 shadow-sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
        <p className="px-1 text-[13px] leading-snug text-ink/50">
          Une fois installée, l'app s'ouvre en plein écran, sans barre de navigateur, comme
          une app normale.
        </p>

        {platform === 'android' && <AndroidInstall />}

        {platform === 'ios' && iosSafari && <IosSteps />}

        {platform === 'ios' && !iosSafari && (
          <div className="card text-[13px] leading-snug text-ink/60">
            Ouvre cette page dans <strong>Safari</strong> pour l'installer : l'ajout à l'écran
            d'accueil ne fonctionne que depuis ce navigateur sur iPhone/iPad.
          </div>
        )}

        {platform === 'other' && (
          <div className="card text-[13px] leading-snug text-ink/60">
            L'installation se fait depuis un iPhone, un iPad ou un téléphone Android.
          </div>
        )}
      </div>

      {onContinue && (
        <div className="px-4 pb-2">
          <button
            type="button"
            className="tap w-full py-3 text-center text-[13px] text-ink/40"
            onClick={onContinue}
          >
            Continuer sans installer
          </button>
        </div>
      )}
    </div>
  )
}
