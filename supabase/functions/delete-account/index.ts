// Goatly — suppression complète d'un compte (droit RGPD à l'effacement)
//
// Appelée directement par le navigateur de l'utilisateur connecté : déployée
// SANS --no-verify-jwt (contrairement à send-reminders), pour que la
// passerelle Supabase rejette d'emblée tout appel non authentifié.
//
// L'id à supprimer vient UNIQUEMENT du jeton vérifié, jamais du corps de la
// requête : sinon n'importe quel utilisateur connecté pourrait effacer le
// compte de n'importe qui en changeant un champ JSON.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { avatarPath } from './path.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
// Clé service-role : seule habilitée à supprimer un compte Auth (API admin)
// et à contourner la RLS pour nettoyer le stockage d'un autre utilisateur
// qu'elle-même n'est pas.
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const BUCKET = 'avatars'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Méthode non supportée.' }, { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return Response.json({ error: 'Authentification requise.' }, { status: 401 })
  }

  try {
    // Lié au jeton de l'appelant : sert uniquement à vérifier QUI demande la
    // suppression, jamais à agir en son nom au-delà de cette lecture.
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await caller.auth.getUser()
    if (userError || !userData?.user) {
      return Response.json({ error: 'Session invalide.' }, { status: 401 })
    }
    const userId = userData.user.id

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // La photo n'est pas couverte par une clé étrangère : à retirer à la
    // main. Best-effort — un fichier déjà absent ne doit pas bloquer la
    // suppression du compte, qui est ce qui compte réellement ici.
    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .remove([avatarPath(userId)])
    if (storageError) console.error('suppression avatar :', storageError)

    // Toutes les autres tables (`profile`, `targets`, `food_entries`,
    // `weights`, `favorites`, `water`, `push_subscriptions`) portent déjà
    // `on delete cascade` sur `user_id references auth.users(id)` : cette
    // seule suppression les vide entièrement.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('suppression du compte :', deleteError)
      return Response.json({ error: 'La suppression a échoué.' }, { status: 500 })
    }

    return Response.json({ deleted: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'La suppression a échoué.' }, { status: 500 })
  }
})
