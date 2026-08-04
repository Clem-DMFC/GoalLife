import { useMemo, useState } from 'react'
import { Logo } from './Logo'
import { MacroBreakdown } from './MacroLine'
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

/** Les huit écrans, dans l'ordre. Un ou deux champs par écran, jamais plus. */
const STEPS = ['name', 'sex', 'age', 'height', 'weight', 'activity', 'goal', 'recap'] as const
type Step = (typeof STEPS)[number]

/** Valeurs de départ : un profil médian, pour n'avoir qu'à ajuster. */
const DEFAULTS = { age: '30', height_cm: '175', weight_kg: '75' }

const RANGES = {
  age: { min: 14, max: 100, label: 'ans' },
  height_cm: { min: 120, max: 230, label: 'cm' },
  weight_kg: { min: 30, max: 250, label: 'kg' },
}

function Choice({
  selected,
  label,
  hint,
  onClick,
}: {
  selected: boolean
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`tap w-full rounded-2xl px-4 py-3 text-left transition-colors ${
        selected ? 'bg-accent text-[#0E1300]' : 'bg-surface text-ink shadow-sm'
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      {hint && (
        <div className={`text-[11px] leading-snug ${selected ? 'opacity-70' : 'text-ink/45'}`}>
          {hint}
        </div>
      )}
    </button>
  )
}

/**
 * Onboarding de première connexion : le profil, puis les objectifs qu'on en
 * déduit. Il ne s'affiche qu'une fois — la validation pose
 * `onboarding_done`.
 */
export function Onboarding({
  onDone,
}: {
  /** Enregistre le profil et les objectifs calculés, puis ouvre l'app. */
  onDone: (profile: Profile, targets: TargetValues, firstName: string | null) => Promise<void>
}) {
  const [step, setStep] = useState<Step>('name')
  const [firstName, setFirstName] = useState('')
  const [sex, setSex] = useState<Sex | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [num, setNum] = useState(DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const index = STEPS.indexOf(step)

  const value = (key: keyof typeof RANGES) => Number(num[key].replace(',', '.'))
  const valid = (key: keyof typeof RANGES) => {
    const v = value(key)
    return Number.isFinite(v) && v >= RANGES[key].min && v <= RANGES[key].max
  }

  const profile: Profile | null = useMemo(() => {
    if (!sex || !activity || !goal) return null
    if (!valid('age') || !valid('height_cm') || !valid('weight_kg')) return null
    return {
      sex,
      age: Math.round(value('age')),
      height_cm: Math.round(value('height_cm')),
      weight_kg: Math.round(value('weight_kg') * 10) / 10,
      activity,
      goal,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sex, activity, goal, num])

  const computed = profile ? computeTargets(profile) : null

  const canContinue =
    // Le prénom est facultatif : on n'enferme personne sur le premier écran.
    step === 'name'
      ? true
      : step === 'sex'
        ? sex !== null
        : step === 'age'
          ? valid('age')
          : step === 'height'
            ? valid('height_cm')
            : step === 'weight'
              ? valid('weight_kg')
              : step === 'activity'
                ? activity !== null
                : step === 'goal'
                  ? goal !== null
                  : profile !== null

  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)])
  const back = () => setStep(STEPS[Math.max(index - 1, 0)])

  const submit = async () => {
    if (!profile || !computed || busy) return
    setBusy(true)
    setError(null)
    try {
      const { bmr: _b, tdee: _t, floored: _f, ...targets } = computed
      const name = firstName.trim()
      await onDone(profile, targets, name === '' ? null : name.slice(0, 40))
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.")
      setBusy(false)
    }
  }

  const numberStep = (key: keyof typeof RANGES, title: string, hint: string) => (
    <>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-[13px] leading-snug text-ink/50">{hint}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <input
          className="field flex-1 text-center text-3xl"
          value={num[key]}
          onChange={(e) => setNum((f) => ({ ...f, [key]: e.target.value }))}
          inputMode={key === 'weight_kg' ? 'decimal' : 'numeric'}
          enterKeyHint="next"
          autoFocus
          aria-label={title}
        />
        <span className="tabular-nums text-sm text-ink/45">{RANGES[key].label}</span>
      </div>
      {!valid(key) && num[key].trim() !== '' && (
        <p className="mt-2 text-[12px] text-danger">
          Entre {RANGES[key].min} et {RANGES[key].max} {RANGES[key].label}.
        </p>
      )}
    </>
  )

  return (
    <div className="safe-top safe-bottom safe-x fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 px-5 pt-4">
        <Logo size={20} className="text-protein" />
        <span className="text-sm font-semibold">Goatly</span>
        <span className="flex-1" />
        <span className="tabular-nums text-[11px] text-ink/35">
          {index + 1} / {STEPS.length}
        </span>
      </header>

      {/* Barre de progression : sept écrans se traversent sans savoir où l'on
          en est, un fil conducteur évite l'impression de tunnel. */}
      <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-6">
        {step === 'name' && (
          <>
            <h2 className="text-xl font-bold tracking-tight">Bienvenue</h2>
            <p className="mt-1 text-[13px] leading-snug text-ink/50">
              Comment veux-tu qu'on t'appelle ? Tu peux passer, et le renseigner plus tard
              dans les réglages.
            </p>
            <input
              className="field mt-6 text-center text-2xl"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ton prénom"
              aria-label="Ton prénom"
              maxLength={40}
              autoFocus
              enterKeyHint="next"
            />
            <p className="mt-3 text-[11px] leading-snug text-ink/40">
              La photo de profil s'ajoute depuis les réglages, une fois le compte ouvert.
            </p>
          </>
        )}

        {step === 'sex' && (
          <>
            <h2 className="text-xl font-bold tracking-tight">
              {firstName.trim() ? `Enchanté ${firstName.trim()}` : 'Faisons connaissance'}
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-ink/50">
              Quelques questions pour estimer tes besoins. Tout reste modifiable ensuite.
            </p>
            <div className="mt-6 space-y-2">
              <Choice selected={sex === 'homme'} label="Homme" onClick={() => setSex('homme')} />
              <Choice selected={sex === 'femme'} label="Femme" onClick={() => setSex('femme')} />
            </div>
            <p className="mt-3 text-[11px] leading-snug text-ink/40">
              La formule de dépense énergétique distingue les deux : c'est la seule raison de
              cette question.
            </p>
          </>
        )}

        {step === 'age' && numberStep('age', 'Ton âge', 'La dépense au repos baisse avec l’âge.')}
        {step === 'height' &&
          numberStep('height_cm', 'Ta taille', 'En centimètres.')}
        {step === 'weight' &&
          numberStep(
            'weight_kg',
            'Ton poids actuel',
            'Il sert de base aux protéines et aux lipides.'
          )}

        {step === 'activity' && (
          <>
            <h2 className="text-xl font-bold tracking-tight">Ton niveau d’activité</h2>
            <p className="mt-1 text-[13px] leading-snug text-ink/50">
              Sur une semaine ordinaire, pas ta meilleure semaine.
            </p>
            <div className="mt-5 space-y-2">
              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                <Choice
                  key={a}
                  selected={activity === a}
                  label={ACTIVITY_LABELS[a].label}
                  hint={ACTIVITY_LABELS[a].hint}
                  onClick={() => setActivity(a)}
                />
              ))}
            </div>
          </>
        )}

        {step === 'goal' && (
          <>
            <h2 className="text-xl font-bold tracking-tight">Ton objectif</h2>
            <p className="mt-1 text-[13px] leading-snug text-ink/50">
              Il détermine l’écart appliqué à ta dépense estimée.
            </p>
            <div className="mt-5 space-y-2">
              {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                <Choice
                  key={g}
                  selected={goal === g}
                  label={GOAL_LABELS[g].label}
                  hint={GOAL_LABELS[g].hint}
                  onClick={() => setGoal(g)}
                />
              ))}
            </div>
          </>
        )}

        {step === 'recap' && computed && profile && (
          <>
            <h2 className="text-xl font-bold tracking-tight">Tes objectifs</h2>
            <p className="mt-1 text-[13px] leading-snug text-ink/50">
              Calculés depuis ton profil.
            </p>

            <div className="card mt-5">
              <div className="flex items-baseline gap-2">
                <span className="tabular-nums text-3xl font-semibold">
                  {computed.kcal}
                </span>
                <span className="text-sm text-ink/45">kcal / jour</span>
              </div>
              <div className="mt-3">
                <MacroBreakdown
                  totals={{
                    kcal: computed.kcal,
                    protein: computed.protein,
                    carbs: computed.carbs,
                    fat: computed.fat,
                  }}
                />
              </div>
            </div>

            <ul className="card mt-3 divide-y divide-ink/5 p-0">
              <li className="flex items-center px-4 py-2.5 text-sm">
                <span className="flex-1 text-ink/60">Métabolisme de base</span>
                <span className="tabular-nums">{computed.bmr} kcal</span>
              </li>
              <li className="flex items-center px-4 py-2.5 text-sm">
                <span className="flex-1 text-ink/60">Dépense estimée</span>
                <span className="tabular-nums">{computed.tdee} kcal</span>
              </li>
              <li className="flex items-center px-4 py-2.5 text-sm">
                <span className="flex-1 text-ink/60">Objectif</span>
                <span className="font-medium">{GOAL_LABELS[profile.goal].label}</span>
              </li>
            </ul>

            {computed.floored && (
              <p className="mt-3 rounded-xl bg-ink/5 px-3 py-2 text-[11px] leading-snug text-ink/60">
                Le calcul descendait sous {KCAL_FLOOR[profile.sex]} kcal. L’objectif a été
                relevé à ce seuil : en dessous, couvrir ses besoins devient difficile.
              </p>
            )}

            <p className="mt-3 text-[11px] leading-snug text-ink/45">
              Ces chiffres sont un point de départ, pas une vérité : la formule estime une
              moyenne statistique, pas ta dépense réelle. Ajuste-les après deux ou trois
              semaines, en fonction de ce que dit la balance. Tout est modifiable dans les
              réglages.
            </p>

            {error && <p className="mt-3 text-[12px] text-danger">{error}</p>}
          </>
        )}
      </div>

      <div className="flex gap-2 px-5 pb-4">
        {index > 0 && (
          <button type="button" className="btn-ghost flex-1 py-3" onClick={back} disabled={busy}>
            Retour
          </button>
        )}
        <button
          type="button"
          className="btn-primary flex-[2] py-3"
          disabled={!canContinue || busy}
          onClick={() => (step === 'recap' ? void submit() : next())}
        >
          {step === 'recap'
            ? busy
              ? '…'
              : 'Valider'
            : step === 'name' && firstName.trim() === ''
              ? 'Passer'
              : 'Continuer'}
        </button>
      </div>
    </div>
  )
}
