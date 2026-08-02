import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EMPTY_TOTALS, type FoodEntry, type MacroTotals } from '../lib/types'

export function sumEntries(entries: FoodEntry[]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { ...EMPTY_TOTALS }
  )
}

export type NewEntry = { name: string } & MacroTotals

/** Entrées alimentaires d'un jour donné. */
export function useFoodEntries(userId: string | undefined, day: string) {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('day', day)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else {
      setEntries(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [userId, day])

  useEffect(() => {
    void reload()
  }, [reload])

  const add = useCallback(
    async (entry: NewEntry) => {
      if (!userId) return
      const { data, error } = await supabase
        .from('food_entries')
        .insert({ user_id: userId, day, ...entry })
        .select()
        .single()
      if (error) {
        setError(error.message)
        throw error
      }
      setEntries((prev) => [...prev, data as FoodEntry])
      setError(null)
    },
    [userId, day]
  )

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('food_entries').delete().eq('id', id)
    if (error) {
      setError(error.message)
      throw error
    }
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setError(null)
  }, [])

  return { entries, totals: sumEntries(entries), loading, error, add, remove, reload }
}
