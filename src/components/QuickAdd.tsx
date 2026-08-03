import { useState } from 'react'
import { PRESETS, PRESET_HINTS } from '../lib/presets'
import type { Favorite, MacroTotals } from '../lib/types'
import type { NewEntry } from '../hooks/useFoodEntries'
import type { NewFavorite } from '../hooks/useFavorites'
import type { Recent } from '../hooks/useRecents'
import { EntryForm } from './EntryForm'

type Tab = 'presets' | 'favorites' | 'recents' | 'manual'

const TABS: [Tab, string][] = [
  ['presets', 'Raccourcis'],
  ['favorites', 'Favoris'],
  ['recents', 'Récents'],
  ['manual', 'Manuel'],
]

function Tile({
  name,
  hint,
  totals,
  onAdd,
  action,
}: {
  name: string
  hint?: string
  totals: MacroTotals
  onAdd: () => void
  action?: { label: string; title: string; onClick: () => void }
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className="tap flex w-full flex-col items-start justify-center rounded-2xl bg-surface px-3 py-2.5 pr-8 text-left shadow-sm"
        onClick={onAdd}
      >
        <span className="w-full truncate text-sm font-semibold leading-tight">{name}</span>
        {hint && <span className="truncate text-[10px] leading-tight text-ink/40">{hint}</span>}
        <span className="mt-1 w-full truncate font-mono text-[10px] tabular-nums text-ink/50">
          {totals.kcal} kcal
          <span className="text-protein"> {totals.protein}P</span>
          <span className="text-carbs"> {totals.carbs}G</span>
          <span className="text-fat"> {totals.fat}L</span>
        </span>
      </button>
      {action && (
        <button
          type="button"
          title={action.title}
          aria-label={action.title}
          className="tap absolute right-0 top-0 flex h-9 w-8 items-center justify-center rounded-lg text-ink/25"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/** Quatre sources d'ajout en un tap : presets figés, favoris, récents, manuel. */
export function QuickAdd({
  favorites,
  recents,
  onAdd,
  onSaveFavorite,
  onRemoveFavorite,
}: {
  favorites: Favorite[]
  recents: Recent[]
  onAdd: (entry: NewEntry) => Promise<boolean>
  onSaveFavorite: (fav: NewFavorite) => Promise<void>
  onRemoveFavorite: (id: string) => Promise<void>
}) {
  const [tab, setTab] = useState<Tab>('presets')
  const [busy, setBusy] = useState(false)

  const add = async (entry: NewEntry) => {
    if (busy) return
    setBusy(true)
    try {
      await onAdd(entry)
    } finally {
      setBusy(false)
    }
  }

  const macrosOf = (x: MacroTotals): MacroTotals => ({
    kcal: x.kcal,
    protein: x.protein,
    carbs: x.carbs,
    fat: x.fat,
  })

  return (
    <section className="space-y-2">
      <div className="flex gap-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tap flex-1 rounded-xl px-2 text-xs font-medium ${
              tab === key ? 'bg-ink text-canvas' : 'bg-surface text-ink/55'
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'presets' && (
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <Tile
              key={p.name}
              name={p.name}
              hint={PRESET_HINTS[p.name]}
              totals={macrosOf(p)}
              onAdd={() => void add(p)}
            />
          ))}
        </div>
      )}

      {tab === 'favorites' &&
        (favorites.length === 0 ? (
          <div className="card text-center text-sm text-ink/40">
            Pas encore de favori. Compose un plat depuis la recherche, ou épingle un aliment
            depuis l'onglet Récents.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {favorites.map((f) => (
              <Tile
                key={f.id}
                name={f.name}
                hint={f.items ? `${f.items.length} ingrédients` : undefined}
                totals={macrosOf(f)}
                onAdd={() => void add({ name: f.name, ...macrosOf(f) })}
                action={{
                  label: '✕',
                  title: `Retirer ${f.name} des favoris`,
                  onClick: () => void onRemoveFavorite(f.id),
                }}
              />
            ))}
          </div>
        ))}

      {tab === 'recents' &&
        (recents.length === 0 ? (
          <div className="card text-center text-sm text-ink/40">
            Rien de récent. Ce que tu saisis apparaîtra ici, réutilisable en un tap.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {recents.map((r) => (
              <Tile
                key={r.name}
                name={r.name}
                totals={macrosOf(r)}
                onAdd={() => void add({ name: r.name, ...macrosOf(r) })}
                action={{
                  label: '★',
                  title: `Ajouter ${r.name} aux favoris`,
                  onClick: () => void onSaveFavorite({ name: r.name, ...macrosOf(r) }),
                }}
              />
            ))}
          </div>
        ))}

      {tab === 'manual' && <EntryForm variant="tab" onAdd={onAdd} />}
    </section>
  )
}
