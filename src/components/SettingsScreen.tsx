import { useState } from 'react'
import { IdentityCard } from './IdentityCard'
import { InstallTutorial } from './InstallTutorial'
import { ProfileSheet } from './ProfileSheet'
import { PushSettings } from './PushSettings'
import { TargetsSheet } from './TargetsSheet'
import { supabase } from '../lib/supabase'
import { deleteAccount } from '../lib/accountDeletion'
import { ACTIVITY_LABELS, computeTargets, GOAL_LABELS, type Profile } from '../lib/nutrition'
import { buildUserDataExport, downloadUserDataExport } from '../lib/dataExport'
import { isStandalone } from '../lib/pwaInstall'
import { formatBrief, requestStrategyBrief } from '../lib/strategyBrief'
import type { Identity, StrategyBrief, TargetValues } from '../lib/types'

const ROWS: { key: keyof TargetValues; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protéines', unit: 'g' },
  { key: 'carbs', label: 'Glucides', unit: 'g' },
  { key: 'fat', label: 'Lipides', unit: 'g' },
  { key: 'water_ml', label: 'Eau', unit: 'ml' },
]

/**
 * Les objectifs et le compte, sur un écran plein plutôt que derrière un
 * engrenage de 9 px dans l'en-tête : c'est là qu'on va les chercher.
 */
export function SettingsScreen({
  email,
  targets,
  onSave,
  userId,
  identity,
  onSaveIdentity,
  profile,
  onSaveProfile,
  brief,
  onSaveBrief,
}: {
  email: string | undefined
  targets: TargetValues
  onSave: (next: TargetValues) => Promise<void>
  userId: string
  identity: Identity
  onSaveIdentity: (next: Partial<Identity>) => Promise<void>
  profile: Profile | null
  /** `nextTargets` absent = le profil change, les objectifs restent. */
  onSaveProfile: (profile: Profile, nextTargets?: TargetValues) => Promise<void>
  brief: StrategyBrief
  onSaveBrief: (text: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const regenerate = async () => {
    if (!profile || regenerating) return
    setRegenerating(true)
    setRegenError(null)
    try {
      const computed = computeTargets(profile, targets)
      const result = await requestStrategyBrief(profile, computed)
      await onSaveBrief(formatBrief(result))
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Brief indisponible pour le moment.')
    } finally {
      setRegenerating(false)
    }
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    setExportError(null)
    try {
      const payload = await buildUserDataExport(userId, email ?? null)
      downloadUserDataExport(payload)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "L'export a échoué.")
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAccount()
      // Le compte n'existe plus côté serveur : la session locale doit
      // tomber tout de suite, sans attendre un prochain appel en échec.
      await supabase.auth.signOut()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'La suppression a échoué.')
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <IdentityCard
          identity={identity}
          email={email}
          userId={userId}
          onSave={onSaveIdentity}
        />

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            Objectifs quotidiens
          </h2>
          <ul className="card divide-y divide-ink/5 p-0">
            {ROWS.map((r) => (
              <li key={r.key} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm">{r.label}</span>
                <span className="tabular-nums text-sm">
                  {targets[r.key]}
                  <span className="ml-1 text-ink/35">{r.unit}</span>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-ghost w-full py-3" onClick={() => setEditing(true)}>
            Modifier les objectifs
          </button>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            Mon profil
          </h2>
          {profile ? (
            <ul className="card divide-y divide-ink/5 p-0">
              <li className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm">Gabarit</span>
                <span className="tabular-nums text-sm">
                  {profile.age} ans · {profile.height_cm} cm · {profile.weight_kg} kg
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm">Activité</span>
                <span className="text-sm text-ink/70">
                  {ACTIVITY_LABELS[profile.activity].label}
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm">Objectif</span>
                <span className="text-sm text-ink/70">{GOAL_LABELS[profile.goal].label}</span>
              </li>
            </ul>
          ) : (
            <div className="card text-sm text-ink/45">
              Profil non renseigné. Le remplir permet d’estimer tes besoins.
            </div>
          )}
          <button
            type="button"
            className="btn-ghost w-full py-3"
            onClick={() => setEditingProfile(true)}
          >
            {profile ? 'Modifier mon profil' : 'Renseigner mon profil'}
          </button>

          {profile && (
            <>
              {brief.strategy_brief && !regenerating && (
                <div className="card">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-protein">
                    Le mot du coach
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed">
                    {brief.strategy_brief}
                  </p>
                </div>
              )}
              {regenerating && (
                <div className="card flex items-center gap-2 text-sm text-ink/40">
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-ink/20 border-t-protein"
                  />
                  Ton coach prépare un mot sur ces chiffres…
                </div>
              )}
              {!regenerating && regenError && (
                <p className="px-1 text-[11px] leading-snug text-ink/35">
                  Brief indisponible pour le moment.
                </p>
              )}
              <button
                type="button"
                className="btn-ghost w-full py-3 text-sm"
                disabled={regenerating}
                onClick={() => void regenerate()}
              >
                {brief.strategy_brief ? 'Régénérer le brief' : 'Générer un brief'}
              </button>
            </>
          )}
        </section>

        <PushSettings />

        {!isStandalone() && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
              Application
            </h2>
            <button
              type="button"
              className="btn-ghost w-full py-3"
              onClick={() => setInstalling(true)}
            >
              Installer l'app
            </button>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            Confidentialité
          </h2>
          <div className="card text-[12px] leading-relaxed text-ink/50">
            Exporte une copie de toutes tes données (profil, objectifs, repas, poids, eau,
            favoris, brief) au format JSON.
          </div>
          {exportError && <p className="px-1 text-[11px] leading-snug text-danger">{exportError}</p>}
          <button
            type="button"
            className="btn-ghost w-full py-3"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? 'Préparation…' : 'Exporter mes données'}
          </button>

          {confirmingDelete ? (
            <div className="card space-y-3">
              <p className="text-[12px] leading-snug text-danger">
                Cette action est irréversible : ton profil, tes objectifs, tes repas, tes poids
                et tes favoris seront définitivement effacés, ainsi que ton compte.
              </p>
              {deleteError && <p className="text-[12px] text-danger">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1 py-3 text-sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1 py-3 text-sm !bg-danger !text-white"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                >
                  {deleting ? '…' : 'Confirmer la suppression'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-ghost w-full py-3 text-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Supprimer mon compte et mes données
            </button>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">Compte</h2>
          <div className="card">
            <div className="text-[11px] uppercase tracking-wide text-ink/40">Connecté en tant que</div>
            <div className="mt-1 truncate text-sm font-medium">{email ?? '—'}</div>
          </div>
          <button
            type="button"
            className="btn-ghost w-full py-3 text-danger"
            onClick={() => void supabase.auth.signOut()}
          >
            Déconnexion
          </button>
        </section>
      </div>

      {editing && (
        <TargetsSheet targets={targets} onClose={() => setEditing(false)} onSave={onSave} />
      )}

      {editingProfile && (
        <ProfileSheet
          profile={profile}
          targets={targets}
          onClose={() => setEditingProfile(false)}
          onSave={onSaveProfile}
          onSaveBrief={onSaveBrief}
        />
      )}

      {installing && <InstallTutorial onClose={() => setInstalling(false)} />}
    </>
  )
}
