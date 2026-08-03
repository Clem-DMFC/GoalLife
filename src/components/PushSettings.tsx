import { useToast } from './Toaster'
import { usePush } from '../hooks/usePush'
import { BLOCKER_MESSAGE } from '../lib/push'
import { REMINDER_TIMES } from '../lib/reminders'

/**
 * Interrupteur des rappels planifiés.
 *
 * L'abonnement part d'un tap et jamais du chargement : iOS refuse une demande
 * de permission qui ne suit pas un geste. Quand l'app n'est pas lancée depuis
 * l'écran d'accueil, on le dit avant de proposer le bouton — Safari en onglet
 * ne donnera jamais d'abonnement.
 */
export function PushSettings() {
  const { enabled, loading, busy, blocker, toggle, test } = usePush()
  const toast = useToast()

  const run = async (action: () => Promise<string | null>, ok: string) => {
    const error = await action()
    if (error) toast.error(error)
    else toast.success(ok)
  }

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">Rappels</h2>

      <div className="card space-y-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Notifications planifiées</div>
            <p className="mt-0.5 text-[11px] leading-snug text-ink/45">
              Pesée, repas et hydratation, aux heures fixes de la journée.
            </p>
          </div>

          {/* La zone tactile fait 48 px, la pastille visible 28 : `.tap` n'est
              pas utilisée ici, son `min-h` écraserait la hauteur du rail et
              l'interrupteur deviendrait un rond. */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Activer les rappels"
            disabled={loading || busy || blocker !== null}
            onClick={() =>
              void run(toggle, enabled ? 'Rappels désactivés' : 'Rappels activés')
            }
            className="-my-2.5 flex h-12 w-12 shrink-0 select-none items-center justify-end self-center disabled:opacity-40"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span
              className={`relative block h-7 w-12 rounded-full transition-colors ${
                enabled ? 'bg-accent' : 'bg-ink/15'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-[left] ${
                  enabled ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>
        </div>

        {blocker && (
          <p className="rounded-xl bg-ink/5 px-3 py-2 text-[11px] leading-snug text-ink/60">
            {BLOCKER_MESSAGE[blocker]}
          </p>
        )}

        {enabled && (
          <>
            <ul className="divide-y divide-ink/5 border-t border-ink/5 pt-1">
              {REMINDER_TIMES.map((r) => (
                <li key={r.at + r.label} className="flex items-center gap-3 py-1.5">
                  <span className="font-mono text-[12px] tabular-nums text-ink/45">{r.at}</span>
                  <span className="flex-1 text-[12px]">{r.label}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-ghost w-full py-3 text-sm"
              disabled={busy}
              onClick={() => void run(test, 'Notification de test envoyée')}
            >
              Envoyer une notif de test
            </button>
          </>
        )}
      </div>
    </section>
  )
}
