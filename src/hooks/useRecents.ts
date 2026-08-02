import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addDays, today } from '../lib/date'
import type { MacroTotals } from '../lib/types'

export type Recent = { name: string } & MacroTotals

const WINDOW_DAYS = 30
const MAX = 15

/**
 * Aliments déjà saisis récemment, dédoublonnés par nom (la saisie la plus
 * récente gagne). Dérivé de food_entries : aucune table supplémentaire.
 */
export function useRecents(userId: string | undefined, refreshKey = 0) {
  const [recents, setRecents] = useState<Recent[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('food_entries')
      .select('name, kcal, protein, carbs, fat, created_at')
      .gte('day', addDays(today(), -WINDOW_DAYS))
      .order('created_at', { ascending: false })
      .limit(300)

    if (error || !data) {
      setLoading(false)
      return
    }

    const byName = new Map<string, Recent>()
    for (const e of data) {
      const key = e.name?.trim().toLowerCase()
      if (!key || byName.has(key)) continue
      byName.set(key, {
        name: e.name,
        kcal: e.kcal,
        protein: e.protein,
        carbs: e.carbs,
        fat: e.fat,
      })
      if (byName.size >= MAX) break
    }

    setRecents([...byName.values()])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  return { recents, loading, reload }
}
