import { useEffect, useRef, useState } from 'react'
import { scaleToGrams, searchFoods, SearchError, type Food } from '../lib/openfoodfacts'
import { EMPTY_TOTALS, type MacroTotals, type MealType, type RecipeItem } from '../lib/types'
import type { NewEntry } from '../hooks/useFoodEntries'
import type { NewFavorite } from '../hooks/useFavorites'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { MacroLine } from './MacroLine'
import { MealPicker } from './MealPicker'

const QUICK_GRAMS = [30, 50, 100, 150, 200, 250]

function sumItems(items: RecipeItem[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fat: acc.fat + i.fat,
    }),
    { ...EMPTY_TOTALS }
  )
}

/**
 * Recherche Open Food Facts, choix de la quantité, et composition d'un plat
 * à partir de plusieurs aliments.
 */
export function FoodSearchSheet({
  meal,
  onMealChange,
  onClose,
  onAdd,
  onSaveFavorite,
}: {
  meal: MealType
  onMealChange: (meal: MealType) => void
  onClose: () => void
  /** Renvoie `true` si l'entrée a bien été écrite — sinon la feuille reste. */
  onAdd: (entry: NewEntry) => Promise<boolean>
  onSaveFavorite: (fav: NewFavorite) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const [selected, setSelected] = useState<Food | null>(null)
  const [grams, setGrams] = useState('100')

  const [basket, setBasket] = useState<RecipeItem[]>([])
  const [showBasket, setShowBasket] = useState(false)
  const [dishName, setDishName] = useState('')
  const [busy, setBusy] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useLockBodyScroll()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Recherche débouncée : on annule la requête précédente à chaque frappe.
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setError(null)
      setSearching(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)
    setTouched(true)
    // L'erreur précédente disparaît dès qu'une nouvelle recherche part :
    // sinon elle restait affichée au dessus des résultats qui arrivaient.
    setError(null)

    const timer = setTimeout(() => {
      searchFoods(term, controller.signal)
        .then((foods) => {
          if (controller.signal.aborted) return
          setResults(foods)
          setError(null)
          setSearching(false)
        })
        .catch((err: unknown) => {
          // Une requête annulée appartient à une frappe périmée : elle ne doit
          // toucher ni aux résultats, ni à l'état de chargement en cours.
          if (controller.signal.aborted) return
          setResults([])
          // Remonter le motif réel : « indisponible » cache trop de causes.
          setError(
            err instanceof SearchError
              ? err.message
              : 'Recherche injoignable. Vérifie ta connexion, ou saisis les valeurs à la main.'
          )
          setSearching(false)
        })
    }, 400)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  const gramsValue = Math.max(0, Math.round(Number(grams.replace(',', '.')) || 0))
  const macros = selected ? scaleToGrams(selected.per100, gramsValue) : EMPTY_TOTALS
  const basketTotals = sumItems(basket)

  const addToDay = async (name: string, m: MacroTotals) => {
    setBusy(true)
    try {
      // Sur échec on garde la feuille ouverte : la saisie n'est pas perdue et
      // le toast d'erreur explique pourquoi rien n'a bougé.
      if (await onAdd({ name, ...m })) onClose()
    } finally {
      setBusy(false)
    }
  }

  const addToBasket = () => {
    if (!selected || gramsValue <= 0) return
    setBasket((prev) => [...prev, { name: selected.name, grams: gramsValue, ...macros }])
    setSelected(null)
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  const saveDish = async () => {
    const name = dishName.trim()
    if (!name || basket.length === 0) return
    setBusy(true)
    try {
      if (!(await onAdd({ name, ...basketTotals }))) return
      await onSaveFavorite({ name, ...basketTotals, items: basket })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 px-4 py-3">
        <h2 className="flex-1 text-lg font-semibold">
          {showBasket ? 'Composer un plat' : 'Rechercher un aliment'}
        </h2>
        <button
          type="button"
          className="tap flex w-11 items-center justify-center rounded-xl bg-surface text-ink/40 shadow-sm"
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
      </header>

      {showBasket ? (
        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <ul className="card divide-y divide-ink/5 p-0">
            {basket.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-center gap-2 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.name}</div>
                  <div className="font-mono text-[11px] text-ink/50">
                    {item.grams} g · {item.kcal} kcal
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Retirer ${item.name}`}
                  className="tap flex w-11 items-center justify-center rounded-lg text-ink/30"
                  onClick={() => setBasket((prev) => prev.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="card space-y-3">
            <MealPicker value={meal} onChange={onMealChange} />
            <div>
              <label className="label" htmlFor="dish-name">
                Nom du plat
              </label>
              <input
                id="dish-name"
                className="field font-sans"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Ex. Poulet riz brocolis"
              />
            </div>
            <MacroLine totals={basketTotals} />
            <p className="text-[11px] leading-snug text-ink/40">
              Le plat est ajouté au jour et enregistré dans tes favoris, réutilisable en un
              tap.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1 py-3"
                onClick={() => setShowBasket(false)}
              >
                Ajouter un ingrédient
              </button>
              <button
                type="button"
                className="btn-primary flex-1 py-3"
                onClick={() => void saveDish()}
                disabled={busy || !dishName.trim()}
              >
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 px-4 pb-2">
            <MealPicker value={meal} onChange={onMealChange} />
            <input
              ref={inputRef}
              className="field font-sans"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(null)
              }}
              placeholder="Skyr, pain complet, houmous…"
              enterKeyHint="search"
              autoCorrect="off"
            />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
            {selected && (
              <div className="card space-y-3">
                <div>
                  <div className="font-semibold leading-tight">{selected.name}</div>
                  {selected.brand && (
                    <div className="text-[11px] text-ink/40">{selected.brand}</div>
                  )}
                  <div className="mt-1 font-mono text-[11px] text-ink/45">
                    {Math.round(selected.per100.kcal)} kcal / 100 g
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="grams">
                    Quantité (g)
                  </label>
                  <input
                    id="grams"
                    className="field text-center text-xl"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selected.servingGrams && (
                    <button
                      type="button"
                      className="tap rounded-lg bg-accent/15 px-3 py-1.5 font-mono text-xs text-protein"
                      onClick={() => setGrams(String(Math.round(selected.servingGrams!)))}
                    >
                      1 portion · {Math.round(selected.servingGrams)} g
                    </button>
                  )}
                  {QUICK_GRAMS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className="tap rounded-lg bg-ink/5 px-3 py-1.5 font-mono text-xs"
                      onClick={() => setGrams(String(g))}
                    >
                      {g} g
                    </button>
                  ))}
                </div>

                <MacroLine totals={macros} />

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost flex-1 py-3 text-sm"
                    onClick={addToBasket}
                    disabled={gramsValue <= 0}
                  >
                    + Au plat
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1 py-3"
                    onClick={() => void addToDay(selected.name, macros)}
                    disabled={busy || gramsValue <= 0}
                  >
                    {busy ? '…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            )}

            {searching && (
              <div className="card text-center text-sm text-ink/30">Recherche…</div>
            )}

            {/* L'erreur ne s'affiche qu'à défaut de résultats : une API de
                repli qui a répondu ne doit pas passer pour une panne. */}
            {error && results.length === 0 && (
              <div className="card text-sm text-danger">{error}</div>
            )}

            {!searching && !error && touched && results.length === 0 && query.trim().length >= 2 && (
              <div className="card text-center text-sm text-ink/40">
                Aucun résultat. Essaie un nom plus simple, ou saisis les valeurs à la main.
              </div>
            )}

            {results.length > 0 && (
              <ul className="card divide-y divide-ink/5 p-0">
                {results.map((f) => (
                  <li key={f.code}>
                    <button
                      type="button"
                      className="tap flex w-full items-center gap-2 px-4 py-2.5 text-left"
                      onClick={() => {
                        setSelected(f)
                        setGrams(f.servingGrams ? String(Math.round(f.servingGrams)) : '100')
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{f.name}</div>
                        <div className="truncate text-[11px] text-ink/40">
                          {f.brand || 'sans marque'}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[11px] tabular-nums text-ink/50">
                        {Math.round(f.per100.kcal)} kcal
                        <div className="text-ink/30">/ 100 g</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!touched && (
              <p className="px-1 text-[12px] leading-snug text-ink/40">
                Les données viennent d'Open Food Facts, une base collaborative. Les valeurs
                sont celles de l'emballage : fiables pour les produits industriels, absentes
                pour beaucoup de produits frais.
              </p>
            )}
          </div>
        </>
      )}

      {basket.length > 0 && !showBasket && (
        <button
          type="button"
          className="safe-bottom tap mx-4 mb-4 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-canvas"
          onClick={() => setShowBasket(true)}
        >
          <span className="text-sm font-medium">
            {basket.length} ingrédient{basket.length > 1 ? 's' : ''}
          </span>
          <span className="font-mono text-sm tabular-nums">{basketTotals.kcal} kcal →</span>
        </button>
      )}
    </div>
  )
}
