import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Weight } from '../lib/types'

const HISTORY = 14

/** Les `HISTORY` dernières pesées, triées de la plus ancienne à la plus récente. */
export function useWeights(userId: string | undefined) {
  const [weights, setWeights] = useState<Weight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('weights')
      .select('*')
      .order('day', { ascending: false })
      .limit(HISTORY)
    if (error) setError(error.message)
    else {
      // Postgres renvoie numeric en string via PostgREST : on normalise.
      const rows = (data ?? []).map((w) => ({ ...w, kg: Number(w.kg) }))
      setWeights(rows.reverse())
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Insère ou met à jour la pesée du jour (contrainte unique user_id + day). */
  const save = useCallback(
    async (day: string, kg: number) => {
      if (!userId) return
      const { error } = await supabase
        .from('weights')
        .upsert({ user_id: userId, day, kg }, { onConflict: 'user_id,day' })
      if (error) {
        setError(error.message)
        throw error
      }
      await reload()
    },
    [userId, reload]
  )

  return { weights, loading, error, save, reload }
}
