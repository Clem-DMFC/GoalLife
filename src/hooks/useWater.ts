import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Total d'eau du jour affiché. Une seule ligne par (user, jour), incrémentée
 * par upsert : pas d'historique des gorgées à stocker.
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

  const write = useCallback(
    async (next: number) => {
      if (!userId) return
      const previous = ml
      setMl(next) // optimiste
      const { error } = await supabase
        .from('water')
        .upsert({ user_id: userId, day, ml: next }, { onConflict: 'user_id,day' })
      if (error) {
        setMl(previous)
        setError(error.message)
        throw error
      }
      setError(null)
    },
    [userId, day, ml]
  )

  const add = useCallback(
    async (delta: number) => {
      await write(Math.max(0, ml + delta))
      setSteps((prev) => [...prev, delta])
    },
    [write, ml]
  )

  /** Retire le dernier ajout fait depuis l'ouverture de l'app. */
  const undo = useCallback(async () => {
    const last = steps[steps.length - 1]
    if (last === undefined) return
    await write(Math.max(0, ml - last))
    setSteps((prev) => prev.slice(0, -1))
  }, [write, ml, steps])

  const reset = useCallback(async () => {
    await write(0)
    setSteps([])
  }, [write])

  return { ml, loading, error, add, undo, reset, canUndo: steps.length > 0 }
}
