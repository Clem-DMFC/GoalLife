import { useEffect, useRef, useState } from 'react'
import { AddSheet } from './AddSheet'
import { DayNav } from './DayNav'
import { MealSections } from './MealSections'
import { RepeatYesterday } from './RepeatYesterday'
import { DaySummary } from './DaySummary'
import { WaterBar } from './WaterBar'
import { useToast } from './Toaster'
import { useFoodEntries, type NewEntry } from '../hooks/useFoodEntries'
import { useFavorites } from '../hooks/useFavorites'
import { useRecents } from '../hooks/useRecents'
import { useWater } from '../hooks/useWater'
import { today } from '../lib/date'
import { MEAL_LABELS, OTHER_LABEL } from '../lib/meals'
import type { FoodEntry, MealType, TargetValues } from '../lib/types'

/** « Ajouté au déjeuner », « Ajouté à la collation » — l'article suit le repas. */
function addedTo(entry: NewEntry): string {
  if (!entry.meal_type) return `${entry.name} ajouté (${OTHER_LABEL.toLowerCase()})`
  const label = MEAL_LABELS[entry.meal_type].toLowerCase()
  const article = entry.meal_type === 'collation' ? 'à la' : 'au'
  return `${entry.name} ajouté ${article} ${label}`
}

export function TodayScreen({
  userId,
  day,
  onDayChange,
  targets,
  addOpen,
  onAddOpenChange,
  addMeal,
  focusWater,
}: {
  userId: string
  day: string
  onDayChange: (day: string) => void
  targets: TargetValues
  /** Pilotée par la barre de navigation, qui porte le bouton d'ajout. */
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
  /** Repas imposé par un deep link de notification. */
  addMeal?: MealType
  /** Amène l'eau sous les yeux, à l'ouverture depuis un rappel d'hydratation. */
  focusWater?: boolean
}) {
  const { entries, totals, loading, error, add, copy, remove } = useFoodEntries(userId, day)
  const water = useWater(userId, day)
  const [dataKey, setDataKey] = useState(0)
  const { recents } = useRecents(userId, dataKey)
  const { favorites, add: addFavorite, remove: removeFavorite } = useFavorites(userId)
  const toast = useToast()
  const waterRef = useRef<HTMLDivElement>(null)

  // Rappel d'hydratation : le bloc de l'eau reste sous le résumé du jour.
  // Il tient désormais dans l'écran, mais un défilement doux le désigne.
  useEffect(() => {
    if (!focusWater) return
    waterRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusWater])

  /**
   * Renvoie si l'écriture a abouti, au lieu de propager l'erreur : la feuille
   * d'ajout ne se referme que sur un vrai succès, et l'échec se voit.
   * Les récents se recalculent après chaque écriture.
   */
  const addEntry = async (entry: NewEntry): Promise<boolean> => {
    try {
      await add(entry)
    } catch {
      toast.error(`« ${entry.name} » n'a pas pu être ajouté. Réessaie.`)
      return false
    }
    setDataKey((k) => k + 1)
    toast.success(addedTo(entry))
    return true
  }

  // Sur un jour passé, copier un repas le recrée sur aujourd'hui — c'est ce
  // qu'on cherche à faire en consultant une journée passée.
  const isToday = day === today()
  const copyTarget = isToday ? day : today()

  const copyEntries = async (of: FoodEntry[]) => {
    try {
      await copy(of, copyTarget)
    } catch {
      toast.error('La copie a échoué. Réessaie.')
      return
    }
    setDataKey((k) => k + 1)
    const where = copyTarget === day ? '' : ' sur aujourd’hui'
    toast.success(`${of.length} entrée${of.length > 1 ? 's' : ''} copiée${of.length > 1 ? 's' : ''}${where}`)
  }

  const removeEntry = async (id: string) => {
    const gone = entries.find((e) => e.id === id)
    try {
      await remove(id)
    } catch {
      toast.error('Suppression impossible. Réessaie.')
      return
    }
    setDataKey((k) => k + 1)
    toast.success(`${gone?.name ?? 'Entrée'} supprimé`)
  }

  return (
    <>
      <div className="space-y-3">
        <DayNav day={day} onChange={onDayChange} />

        <DaySummary totals={totals} targets={targets} />

        <div ref={waterRef}>
          <WaterBar
            ml={water.ml}
            target={targets.water_ml}
            canUndo={water.canUndo}
            onAdd={water.add}
            onUndo={water.undo}
            onReset={water.reset}
          />
        </div>

        <section className="space-y-1.5">
          {loading ? (
            <div className="card text-center text-sm text-ink/30">Chargement…</div>
          ) : (
            <MealSections
              entries={entries}
              onRemove={removeEntry}
              onCopy={copyEntries}
              copyLabel={isToday ? 'Dupliquer le repas' : 'Copier vers aujourd’hui'}
            />
          )}
        </section>

        {!loading && (
          <RepeatYesterday userId={userId} day={day} entries={entries} onCopy={copyEntries} />
        )}

        {(error ?? water.error) && (
          <p className="px-1 text-sm text-danger">{error ?? water.error}</p>
        )}
      </div>

      {addOpen && (
        <AddSheet
          favorites={favorites}
          recents={recents}
          initialMeal={addMeal}
          onClose={() => onAddOpenChange(false)}
          onAdd={addEntry}
          onSaveFavorite={addFavorite}
          onRemoveFavorite={removeFavorite}
        />
      )}
    </>
  )
}
