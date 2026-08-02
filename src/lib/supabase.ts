import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variables d\'environnement manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY. ' +
      'Copie .env.example en .env et remplis-les.'
  )
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Pas de magic link : on lit jamais la session depuis l'URL.
    detectSessionInUrl: false,
  },
})
