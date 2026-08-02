import { useEffect, useState } from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import type { MacroTotals } from '../lib/types'

const FIELDS: { key: keyof MacroTotals; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protéines', unit: 'g' },
  { key: 'carbs', label: 'Glucides', unit: 'g' },
  { key: 'fat', label: 'Lipides', unit: 'g' },
]

/** Feuille modale d'édition des objectifs. */
export function TargetsSheet({
  targets,
  onClose,
  onSave,
}: {
  targets: MacroTotals
  onClose: () => void
  onSave: (next: MacroTotals) => Promise<void>
}) {
  const [form, setForm] = useState<Record<keyof MacroTotals, string>>({
    kcal: String(targets.kcal),
    protein: String(targets.protein),
    carbs: String(targets.carbs),
    fat: String(targets.fat),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useLockBodyScroll()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave({
        kcal: Math.max(0, Math.round(Number(form.kcal) || 0)),
        protein: Math.max(0, Math.round(Number(form.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(form.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(form.fat) || 0)),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la sauvegarde')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30">
      <button
        type="button"
        aria-label="Fermer"
        className="flex-1"
        onClick={onClose}
      />
      <form
        className="safe-bottom rounded-t-3xl bg-white p-5 pb-8 shadow-2xl"
        onSubmit={submit}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10" />
        <h2 className="mb-4 text-lg font-semibold">Objectifs quotidiens</h2>

        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <label className="flex-1 text-sm font-medium" htmlFor={`target-${f.key}`}>
                {f.label}
                <span className="ml-1 text-black/35">({f.unit})</span>
              </label>
              <input
                id={`target-${f.key}`}
                className="field w-28 text-center"
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-protein">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" className="btn-ghost flex-1 py-3" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1 py-3" disabled={busy}>
            {busy ? '…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
