import { useState } from 'react'
import { PRESETS, PRESET_HINTS, type Preset } from '../lib/presets'

export function PresetGrid({ onAdd }: { onAdd: (p: Preset) => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null)

  const handle = async (p: Preset) => {
    setBusy(p.name)
    try {
      await onAdd(p)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.name}
          type="button"
          className="tap flex flex-col items-start justify-center rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm disabled:opacity-50"
          onClick={() => void handle(p)}
          disabled={busy !== null}
        >
          <span className="text-sm font-semibold leading-tight">{p.name}</span>
          {PRESET_HINTS[p.name] && (
            <span className="text-[10px] leading-tight text-black/40">
              {PRESET_HINTS[p.name]}
            </span>
          )}
          <span className="mt-1 font-mono text-[11px] tabular-nums text-black/50">
            {p.kcal} kcal
            <span className="text-protein"> · {p.protein}P</span>
            <span className="text-carbs"> {p.carbs}G</span>
            <span className="text-fat"> {p.fat}L</span>
          </span>
        </button>
      ))}
    </div>
  )
}
