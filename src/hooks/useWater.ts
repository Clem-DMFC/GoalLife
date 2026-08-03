import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Total d'eau du jour affiché. Une seule ligne par (user, jour).
 *
 * L'addition est faite par la fonction SQL `add_water` et non côté client :
 * un double tap ou un retry réseau ne peut plus écraser l'ajout précédent.
 * Le total renvoyé par Postgres fait foi.
 */
export function useWater(userId: string | undefined, day: string) {
  const [ml, setMl] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Ajouts de la session, pour annuler le dernier tap en cas de faux pas. */
  const [steps, setSteps] = useState<number[]>([])

  useEffect(() => {
    if (!userId) return
    let alive = true
    setLoading(true)
    setSteps([])

    supabase
      .from('water')
      .select('ml')
      .eq('day', day)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) setError(error.message)
        else {
          setMl(data?.ml ?? 0)
          setError(null)
        }
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [userId, day])

  const shift = useCallback(
    async (delta: number) => {
      if (!userId) return
      const previous = ml
      setMl(Math.max(0, ml + delta)) // optimiste, en attendant le vrai total
      const { data, error } = await supabase.rpc('add_water', {
        delta,
        target_day: day,
      })
      if (error) {
        setMl(previous)
        setError(error.message)
        throw error
      }
      setMl(data ?? 0)
      setError(null)
    },
    [userId, day, ml]
  )

  const add = useCallback(
    async (delta: number) => {
      await shift(delta)
      setSteps((prev) => [...prev, delta])
    },
    [shift]
  )

  /** Retire le dernier ajout fait depuis l'ouverture de l'app. */
  const undo = useCallback(async () => {
    const last = steps[steps.length - 1]
    if (last === undefined) return
    await shift(-last)
    setSteps((prev) => prev.slice(0, -1))
  }, [shift, steps])

  /** Remise à zéro : pas d'incrément ici, on écrase volontairement le total. */
  const reset = useCallback(async () => {
    if (!userId) return
    const previous = ml
    setMl(0)
    const { error } = await supabase
      .from('water')
      .upsert({ user_id: userId, day, ml: 0 }, { onConflict: 'user_id,day' })
    if (error) {
      setMl(previous)
      setError(error.message)
      throw error
    }
    setSteps([])
    setError(null)
  }, [userId, day, ml])

  return { ml, loading, error, add, undo, reset, canUndo: steps.length > 0 }
}
