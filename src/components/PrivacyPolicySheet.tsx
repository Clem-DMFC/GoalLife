import { Logo } from './Logo'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

/**
 * Contenu provisoire : la structure (lien depuis le consentement, feuille
 * fermable) est posée maintenant, le texte définitif viendra plus tard.
 */
export function PrivacyPolicySheet({ onClose }: { onClose: () => void }) {
  useLockBodyScroll()

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 px-4 py-3">
        <Logo size={20} className="text-protein" />
        <h1 className="flex-1 text-lg font-semibold">Confidentialité</h1>
        <button
          type="button"
          className="tap flex w-11 items-center justify-center rounded-xl bg-surface text-ink/40 shadow-sm"
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6 text-[13px] leading-relaxed text-ink/60">
        <p>
          Goatly enregistre les données que tu renseignes (profil, objectifs, repas, poids, eau)
          pour te proposer un suivi personnalisé, ainsi qu'un brief généré par IA qui commente
          tes objectifs sans jamais les recalculer.
        </p>
        <p>
          Ces données ne sont ni vendues ni partagées avec des tiers à des fins publicitaires.
          Tu peux à tout moment exporter une copie complète de tes données ou supprimer ton
          compte depuis Réglages → Confidentialité.
        </p>
        <p className="text-ink/40">
          Le détail complet de cette politique (durées de conservation, sous-traitants,
          coordonnées du responsable de traitement) sera publié ici prochainement.
        </p>
      </div>
    </div>
  )
}
