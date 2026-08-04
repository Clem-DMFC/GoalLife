import { supabase } from './supabase'

/**
 * Droit à l'effacement (RGPD). Passe par une fonction Edge en clé
 * service-role : seule l'API admin de Supabase Auth peut supprimer un
 * compte, et cette clé ne doit jamais atteindre le navigateur.
 */
export class AccountDeletionError extends Error {}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account')
  if (error) throw new AccountDeletionError(error.message)
}
