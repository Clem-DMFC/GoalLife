import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addDays, today } from '../lib/date'
import { EMPTY_TOTALS, type FoodEntry, type MacroTotals } from '../lib/types'

export type DayTotals = { day: string } & MacroTotals

/**
 * Totaux par jour sur les `days` derniers jours (aujourd'hui inclus).
 * Sert à l'historique et à la moyenne hebdo.
 */
export function useHistory(userId: string | undefined, days = 14, refreshKey = 0) {
  const [rows, setRows] = useState<DayTotals[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const from = addDays(today(), -(days - 1))
    const { data, error } = await supabase
      .from('food_entries')
      .select('day, kcal, protein, carbs, fat')
      .gte('day', from)
      .order('day', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const byDay = new Map<string, DayTotals>()
    for (const e of (data ?? []) as Pick<FoodEntry, 'day' | keyof MacroTotals>[]) {
      const cur = byDay.get(e.day) ?? { day: e.day, ...EMPTY_TOTALS }
      cur.kcal += e.kcal
      cur.protein += e.protein
      cur.carbs += e.carbs
      cur.fat += e.fat
      byDay.set(e.day, cur)
    }

    setRows([...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1)))
    setError(null)
    setLoading(false)
  }, [userId, days])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  return { rows, loading, error, reload }
}

/** Moyenne des kcal sur les jours effectivement renseignés des 7 derniers jours. */
export function weeklyAverage(rows: DayTotals[]): { avg: number; days: number } {
  const from = addDays(today(), -6)
  const week = rows.filter((r) => r.day >= from && r.kcal > 0)
  if (week.length === 0) return { avg: 0, days: 0 }
  const sum = week.reduce((a, r) => a + r.kcal, 0)
  return { avg: Math.round(sum / week.length), days: week.length }
}
