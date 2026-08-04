import { supabase } from './supabase'

/**
 * Droit à la portabilité (RGPD) : toutes les tables contenant des données
 * personnelles, dans un seul fichier. `reminder_log` en est exclu : c'est un
 * journal global d'idempotence du cron, sans colonne `user_id`, pas une
 * donnée personnelle.
 */
const TABLES = [
  'profile',
  'targets',
  'food_entries',
  'weights',
  'favorites',
  'water',
  'push_subscriptions',
] as const

export type UserDataExport = {
  exported_at: string
  user_id: string
  email: string | null
} & { [K in (typeof TABLES)[number]]: unknown[] }

/**
 * Chaque table est déjà filtrée par RLS sur `auth.uid()` : un simple
 * `select('*')` par table suffit, pas besoin de fonction serveur.
 */
export async function buildUserDataExport(
  userId: string,
  email: string | null
): Promise<UserDataExport> {
  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*')
      if (error) throw new Error(`${table} : ${error.message}`)
      return [table, data ?? []] as const
    })
  )

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    email,
    ...Object.fromEntries(results),
  } as UserDataExport
}

/** Déclenche le téléchargement du fichier, sans passer par un lien visible. */
export function downloadUserDataExport(payload: UserDataExport) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `goallife-donnees-${payload.exported_at.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
