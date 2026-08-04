import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/nutrition'
import type { Identity, ProfileRow } from '../lib/types'

const EMPTY_IDENTITY: Identity = { first_name: null, avatar_url: null }

/**
 * Profil de l'utilisateur, et décision d'afficher ou non l'onboarding.
 *
 * Deux moitiés dans la même ligne : le gabarit qui alimente le calcul
 * (`Profile`), et l'identité qui ne sert qu'à l'affichage (`Identity`). Elles
 * s'enregistrent séparément — changer sa photo n'a pas à toucher au poids.
 *
 * Les comptes créés avant l'ajout du profil n'ont pas de ligne : l'absence se
 * lit comme « onboarding à faire », sans que rien ne plante.
 */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [identity, setIdentity] = useState<Identity>(EMPTY_IDENTITY)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)

    supabase
      .from('profile')
      .select(
        'sex, age, height_cm, weight_kg, activity, goal, onboarding_done, first_name, avatar_url'
      )
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          // Table absente (migration pas encore passée) ou réseau coupé : on
          // n'enferme pas l'utilisateur dans un onboarding qu'on ne saura pas
          // enregistrer. L'app s'ouvre avec les objectifs par défaut.
          setError(error.message)
          setDone(true)
        } else if (data) {
          const row = data as Partial<ProfileRow>
          setDone(row.onboarding_done === true)
          setIdentity({
            first_name: row.first_name ?? null,
            avatar_url: row.avatar_url ?? null,
          })
          if (row.sex && row.activity && row.goal) {
            setProfile({
              sex: row.sex,
              age: Number(row.age),
              height_cm: Number(row.height_cm),
              // `numeric` peut revenir en chaîne selon la version de PostgREST.
              weight_kg: Number(row.weight_kg),
              activity: row.activity,
              goal: row.goal,
            })
          }
        } else {
          setDone(false)
        }
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [userId])

  /** Crée ou met à jour le gabarit, et clôt l'onboarding. */
  const save = useCallback(
    async (next: Profile, nextIdentity?: Partial<Identity>) => {
      if (!userId) return
      const { error } = await supabase.from('profile').upsert({
        user_id: userId,
        ...next,
        ...nextIdentity,
        onboarding_done: true,
        updated_at: new Date().toISOString(),
      })
      if (error) {
        setError(error.message)
        throw error
      }
      setProfile(next)
      if (nextIdentity) setIdentity((prev) => ({ ...prev, ...nextIdentity }))
      setDone(true)
      setError(null)
    },
    [userId]
  )

  /**
   * Met à jour la seule identité. `update` et non `upsert` : sans ligne de
   * profil il n'y a pas encore de gabarit, et insérer ici violerait les
   * colonnes obligatoires.
   */
  const saveIdentity = useCallback(
    async (next: Partial<Identity>) => {
      if (!userId) return
      const { error } = await supabase
        .from('profile')
        .update({ ...next, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) {
        setError(error.message)
        throw error
      }
      setIdentity((prev) => ({ ...prev, ...next }))
      setError(null)
    },
    [userId]
  )

  return { profile, identity, loading, error, onboardingDone: done, save, saveIdentity }
}
