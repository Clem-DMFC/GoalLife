import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TARGETS, type MacroTotals } from '../lib/types'

/**
 * Les objectifs sont une ligne unique par user. Si elle n'existe pas encore,
 * on affiche les valeurs par défaut et on la crée à la première sauvegarde.
 */
export function useTargets(userId: string | undefined) {
  const [targets, setTargets] = useState<MacroTotals>(DEFAULT_TARGETS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let alive = true
    setLoading(true)

    supabase
      .from('targets')
      .select('kcal, protein, carbs, fat')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) setError(error.message)
        else if (data) setTargets(data as MacroTotals)
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [userId])

  const save = useCallback(
    async (next: MacroTotals) => {
      if (!userId) return
      const previous = targets
      setTargets(next) // optimiste
      const { error } = await supabase
        .from('targets')
        .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() })
      if (error) {
        setTargets(previous)
        setError(error.message)
        throw error
      }
      setError(null)
    },
    [userId, targets]
  )

  return { targets, loading, error, save }
}
