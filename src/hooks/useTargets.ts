import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_TARGETS, type TargetValues } from '../lib/types'

/**
 * Les objectifs sont une ligne unique par user. Si elle n'existe pas encore,
 * on affiche les valeurs par défaut et on la crée à la première sauvegarde.
 */
export function useTargets(userId: string | undefined) {
  const [targets, setTargets] = useState<TargetValues>(DEFAULT_TARGETS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let alive = true
    setLoading(true)

    supabase
      .from('targets')
      .select('kcal, protein, carbs, fat, water_ml')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) setError(error.message)
        // Fusion sur les valeurs par défaut : une ligne créée avant l'ajout
        // d'un objectif (l'eau) n'a pas la colonne renseignée.
        else if (data) setTargets({ ...DEFAULT_TARGETS, ...(data as Partial<TargetValues>) })
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [userId])

  const save = useCallback(
    async (next: TargetValues) => {
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
