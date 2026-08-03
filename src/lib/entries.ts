import { supabase } from './supabase'
import type { FoodEntry } from './types'

/** Champs recopiés lors d'une duplication — l'id, le jour et la date sont neufs. */
type Copyable = Pick<FoodEntry, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat' | 'meal_type'>

export async function fetchDayEntries(day: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('day', day)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/**
 * Recopie des entrées sur un jour cible : ce sont de nouvelles lignes
 * (nouveaux id), pas des références. Retourne les lignes créées.
 */
export async function copyEntriesTo(
  userId: string,
  day: string,
  entries: Copyable[]
): Promise<FoodEntry[]> {
  if (entries.length === 0) return []
  const { data, error } = await supabase
    .from('food_entries')
    .insert(
      entries.map((e) => ({
        user_id: userId,
        day,
        name: e.name,
        kcal: e.kcal,
        protein: e.protein,
        carbs: e.carbs,
        fat: e.fat,
        meal_type: e.meal_type,
      }))
    )
    .select()
  if (error) throw error
  return (data ?? []) as FoodEntry[]
}

/** Duplique tout l'alimentaire d'un jour vers un autre. Ni l'eau ni le poids. */
export async function duplicateDay(
  userId: string,
  fromDay: string,
  toDay: string
): Promise<number> {
  const entries = await fetchDayEntries(fromDay)
  const created = await copyEntriesTo(userId, toDay, entries)
  return created.length
}
