import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Favorite, MacroTotals, RecipeItem } from '../lib/types'

export type NewFavorite = { name: string; items?: RecipeItem[] | null } & MacroTotals

export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      setFavorites(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const add = useCallback(
    async (fav: NewFavorite) => {
      if (!userId) return
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, items: null, ...fav })
        .select()
        .single()
      if (error) {
        setError(error.message)
        throw error
      }
      setFavorites((prev) => [data as Favorite, ...prev])
      setError(null)
    },
    [userId]
  )

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id)
    if (error) {
      setError(error.message)
      throw error
    }
    setFavorites((prev) => prev.filter((f) => f.id !== id))
  }, [])

  return { favorites, loading, error, add, remove, reload }
}
