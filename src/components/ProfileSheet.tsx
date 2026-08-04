import { useState } from 'react'
import { MacroBreakdown } from './MacroLine'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import {
  ACTIVITY_LABELS,
  computeTargets,
  GOAL_LABELS,
  KCAL_FLOOR,
  type Activity,
  type Goal,
  type Profile,
  type Sex,
} from '../lib/nutrition'
import type { TargetValues } from '../lib/types'

const RANGES = {
  age: { min: 14, max: 100, unit: 'ans', label: 'Âge' },
  height_cm: { min: 120, max: 230, unit: 'cm', label: 'Taille' },
  weight_kg: { min: 30, max: 250, unit: 'kg', label: 'Poids' },
}

/**
 * Édition du profil, avec recalcul des objectifs.
 *
 * Le recalcul est proposé, jamais imposé : l'utilisateur a pu ajuster ses
 * objectifs à la main, et un poids mis à jour ne doit pas balayer ce réglage
 * sans qu'il le demande.
 */
export function ProfileSheet({
  profile,
  targets,
  onClose,
  onSave,
}: {
  profile: Profile | null
  targets: TargetValues
  onClose: () => void
  /** `nextTargets` absent = on garde les objectifs actuels. */
  onSave: (profile: Profile, nextTargets?: TargetValues) => Promise<void>
}) {
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'homme')
  const [activity, setActivity] = useState<Activity>(profile?.activity ?? 'modere')
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintien')
  const [num, setNum] = useState({
    age: String(profile?.age ?? 30),
    height_cm: String(profile?.height_cm ?? 175),
    weight_kg: String(profile?.weight_kg ?? 75),
  })
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useLockBodyScroll()

  const value = (k: keyof typeof RANGES) => Number(num[k].replace(',', '.'))
  const valid = (k: keyof typeof RANGES) => {
    const v = value(k)
    return Number.isFinite(v) && v >= RANGES[k].min && v <= RANGES[k].max
  }
  const allValid = valid('age') && valid('height_cm') && valid('weight_kg')

  const next: Profile | null = allValid
    ? {
        sex,
        age: Math.round(value('age')),
        height_cm: Math.round(value('height_cm')),
        weight_kg: Math.round(value('weight_kg') * 10) / 10,
        activity,
        goal,
      }
    : null

  const computed = next ? computeTargets(next, targets) : null
  // Un recalcul qui ne changerait rien n'a pas à être confirmé.
  const wouldChange =
    computed !== null &&
    (computed.kcal !== targets.kcal ||
      computed.protein !== targets.protein ||
      computed.carbs !== targets.carbs ||
      computed.fat !== targets.fat)

  const submit = async (withTargets: boolean) => {
    if (!next || !computed || busy) return
    setBusy(true)
    setError(null)
    try {
      if (withTargets) {
        const { bmr: _b, tdee: _t, floored: _f, ...values } = computed
        await onSave(next, values)
      } else {
        await onSave(next)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.")
      setBusy(false)
    }
  }

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 px-4 py-3">
        <h2 className="flex-1 text-lg font-semibold">Mon profil</h2>
        <button
          type="button"
          className="tap flex w-11 items-center justify-center rounded-xl bg-surface text-ink/40 shadow-sm"
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
        <div>
          <span className="label">Sexe</span>
          <div className="flex gap-1.5">
            {(['homme', 'femme'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sex === s}
                onClick={() => setSex(s)}
                className={`tap flex-1 rounded-xl px-2 text-sm font-medium ${
                  sex === s ? 'bg-accent text-[#0E1300]' : 'bg-surface text-ink/55 shadow-sm'
                }`}
              >
                {s === 'homme' ? 'Homme' : 'Femme'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((k) => (
            <div key={k}>
              <label className="label" htmlFor={`profile-${k}`}>
                {RANGES[k].label}
              </label>
              <input
                id={`profile-${k}`}
                className="field px-2 text-center"
                value={num[k]}
                onChange={(e) => setNum((f) => ({ ...f, [k]: e.target.value }))}
                inputMode={k === 'weight_kg' ? 'decimal' : 'numeric'}
              />
              <div className="mt-1 text-center tabular-nums text-[10px] text-ink/35">
                {RANGES[k].unit}
              </div>
            </div>
          ))}
        </div>

        {!allValid && (
          <p className="text-[12px] text-danger">
            Vérifie l’âge ({RANGES.age.min}–{RANGES.age.max}), la taille (
            {RANGES.height_cm.min}–{RANGES.height_cm.max} cm) et le poids (
            {RANGES.weight_kg.min}–{RANGES.weight_kg.max} kg).
          </p>
        )}

        <div>
          <span className="label">Niveau d’activité</span>
          <div className="space-y-1.5">
            {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={activity === a}
                onClick={() => setActivity(a)}
                className={`tap w-full rounded-xl px-3 py-2 text-left ${
                  activity === a ? 'bg-accent text-[#0E1300]' : 'bg-surface shadow-sm'
                }`}
              >
                <div className="text-[13px] font-medium">{ACTIVITY_LABELS[a].label}</div>
                <div
                  className={`text-[10px] leading-snug ${
                    activity === a ? 'opacity-70' : 'text-ink/40'
                  }`}
                >
                  {ACTIVITY_LABELS[a].hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Objectif</span>
          <div className="space-y-1.5">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={goal === g}
                onClick={() => setGoal(g)}
                className={`tap w-full rounded-xl px-3 py-2 text-left ${
                  goal === g ? 'bg-accent text-[#0E1300]' : 'bg-surface shadow-sm'
                }`}
              >
                <div className="text-[13px] font-medium">{GOAL_LABELS[g].label}</div>
                <div
                  className={`text-[10px] leading-snug ${
                    goal === g ? 'opacity-70' : 'text-ink/40'
                  }`}
                >
                  {GOAL_LABELS[g].hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        {computed && (
          <div className="card">
            <div className="text-[11px] uppercase tracking-wide text-ink/40">
              Objectifs recalculés
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tabular-nums text-2xl font-semibold">
                {computed.kcal}
              </span>
              <span className="text-sm text-ink/45">kcal</span>
              {!wouldChange && (
                <span className="ml-auto text-[11px] text-ink/40">identiques aux tiens</span>
              )}
            </div>
            <div className="mt-2">
              <MacroBreakdown
                totals={{
                  kcal: computed.kcal,
                  protein: computed.protein,
                  carbs: computed.carbs,
                  fat: computed.fat,
                }}
              />
            </div>
            {computed.floored && (
              <p className="mt-2 text-[11px] leading-snug text-ink/50">
                Relevé au plancher de {KCAL_FLOOR[sex]} kcal.
              </p>
            )}
            <p className="mt-2 text-[11px] leading-snug text-ink/40">
              Une estimation, pas une mesure : ajuste selon ce que dit la balance.
            </p>
          </div>
        )}

        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>

      <div className="space-y-2 px-4 pb-4">
        {confirming ? (
          <div className="card space-y-3">
            <p className="text-[12px] leading-snug">
              Remplacer tes objectifs actuels ({targets.kcal} kcal · {targets.protein} P ·{' '}
              {targets.carbs} G · {targets.fat} L) par ceux qui viennent d’être calculés ?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1 py-3 text-sm"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary flex-1 py-3 text-sm"
                onClick={() => void submit(true)}
                disabled={busy}
              >
                {busy ? '…' : 'Remplacer'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary w-full py-3"
              disabled={!allValid || busy || !wouldChange}
              onClick={() => setConfirming(true)}
            >
              Enregistrer et recalculer les objectifs
            </button>
            <button
              type="button"
              className="btn-ghost w-full py-3 text-sm"
              disabled={!allValid || busy}
              onClick={() => void submit(false)}
            >
              {busy ? '…' : 'Enregistrer le profil seul'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
