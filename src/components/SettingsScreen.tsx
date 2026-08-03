import { useState } from 'react'
import { TargetsSheet } from './TargetsSheet'
import { supabase } from '../lib/supabase'
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
}: {
  email: string | undefined
  targets: TargetValues
  onSave: (next: TargetValues) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)

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
    </>
  )
}
