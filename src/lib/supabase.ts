import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Config manquante : on ne lève pas au chargement du module, sinon React ne
 * monte jamais et l'utilisateur n'a qu'une page blanche. L'app affiche un
 * écran d'explication à la place (voir ConfigError).
 */
export const missingEnv: string[] = [
  !url && 'VITE_SUPABASE_URL',
  !anonKey && 'VITE_SUPABASE_ANON_KEY',
].filter((v): v is string => typeof v === 'string')

export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Pas de magic link : on ne lit jamais la session depuis l'URL.
      detectSessionInUrl: false,
    },
  }
)
