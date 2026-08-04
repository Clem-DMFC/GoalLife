import { useState } from 'react'
import { ProfileSheet } from './ProfileSheet'
import { PushSettings } from './PushSettings'
import { TargetsSheet } from './TargetsSheet'
import { supabase } from '../lib/supabase'
import { ACTIVITY_LABELS, GOAL_LABELS, type Profile } from '../lib/nutrition'
import type { TargetValues } from '../lib/types'

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
  profile,
  onSaveProfile,
}: {
  email: string | undefined
  targets: TargetValues
  onSave: (next: TargetValues) => Promise<void>
  profile: Profile | null
  /** `nextTargets` absent = le profil change, les objectifs restent. */
  onSaveProfile: (profile: Profile, nextTargets?: TargetValues) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  return (
    <>
      <div className="space-y-3">
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            Objectifs quotidiens
          </h2>
          <ul className="card divide-y divide-ink/5 p-0">
            {ROWS.map((r) => (
              <li key={r.key} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm">{r.label}</span>
                <span className="font-mono text-sm tabular-nums">
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
                <span className="font-mono text-sm tabular-nums">
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
        </section>

        <PushSettings />

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
        />
      )}
    </>
  )
}
