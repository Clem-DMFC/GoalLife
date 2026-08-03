import { useState } from 'react'
import type { NewEntry } from '../hooks/useFoodEntries'

const EMPTY = { name: '', kcal: '', protein: '', carbs: '', fat: '' }

export function EntryForm({
  onAdd,
  variant = 'inline',
}: {
  /** Renvoie `true` si l'entrée a bien été écrite — sinon le formulaire reste. */
  onAdd: (entry: NewEntry) => Promise<boolean>
  /** 'tab' : toujours affiché, sans bouton de repli — utilisé dans AddSheet. */
  variant?: 'inline' | 'tab'
}) {
  const [open, setOpen] = useState(variant === 'tab')
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const num = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || busy) return
    setBusy(true)
    try {
      const ok = await onAdd({
        name: form.name.trim(),
        kcal: num(form.kcal),
        protein: num(form.protein),
        carbs: num(form.carbs),
        fat: num(form.fat),
      })
      // Sur échec la saisie reste à l'écran : rien à retaper.
      if (!ok) return
      setForm(EMPTY)
      if (variant === 'inline') setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn-ghost w-full py-3" onClick={() => setOpen(true)}>
        + Saisie manuelle
      </button>
    )
  }

  return (
    <form className={variant === 'tab' ? 'space-y-3' : 'card space-y-3'} onSubmit={submit}>
      <div>
        <label className="label" htmlFor="entry-name">
          Aliment
        </label>
        <input
          id="entry-name"
          className="field font-sans"
          value={form.name}
          onChange={set('name')}
          placeholder="Ex. Pâtes bolo"
          autoFocus
          enterKeyHint="done"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(
          [
            ['kcal', 'kcal'],
            ['protein', 'P'],
            ['carbs', 'G'],
            ['fat', 'L'],
          ] as const
        ).map(([key, lbl]) => (
          <div key={key}>
            <label className="label" htmlFor={`entry-${key}`}>
              {lbl}
            </label>
            <input
              id={`entry-${key}`}
              className="field px-2 text-center"
              value={form[key]}
              onChange={set(key)}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {variant === 'inline' && (
          <button
            type="button"
            className="btn-ghost flex-1 py-3"
            onClick={() => {
              setForm(EMPTY)
              setOpen(false)
            }}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          className="btn-primary flex-1 py-3"
          disabled={!form.name.trim() || busy}
        >
          {busy ? '…' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
