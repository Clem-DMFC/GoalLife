// Goatly — envoi des rappels planifiés (Web Push)
//
// Appelée chaque minute par pg_cron (via pg_net). À chaque passage elle
// compare l'heure de Paris au planning ; si un créneau tombe, elle pousse la
// notification à tous les abonnements enregistrés.
//
// Deux modes :
//   { "test": true }  → envoie une notification immédiate (bouton « notif de
//                       test » des réglages), sans toucher au journal.
//   sinon             → mode planifié, déclenché par le cron.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@0.3'
import { dueReminder, parisDay, parisTime, REMINDERS, type Reminder } from './schedule.ts'
import { vapidKeysToJwk } from './vapid.ts'

type SubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// Clé service-role : elle contourne la RLS, ce qui est exactement ce qu'il
// faut ici — la fonction doit joindre tous les abonnés, pas un seul.
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/* La paire VAPID ne change jamais : on l'importe une fois pour toutes les
   invocations qui partagent l'isolat, pas à chaque requête. */
const appServer = await webpush.ApplicationServer.new({
  contactInformation: VAPID_SUBJECT,
  vapidKeys: await webpush.importVapidKeys(
    vapidKeysToJwk(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY),
    { extractable: false }
  ),
})

const TEST_REMINDER: Reminder = {
  slot: 'test',
  at: '00:00',
  title: '🐐 Goatly',
  body: 'Notification de test — la chaîne complète fonctionne.',
  url: '/?go=today',
}

/** Un abonnement mort répond 404 ou 410 : sa ligne n'a plus lieu d'être. */
function isGone(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  return status === 404 || status === 410
}

async function pushToAll(reminder: Reminder) {
  const { data: subs, error } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error) throw new Error(`lecture des abonnements : ${error.message}`)
  if (!subs || subs.length === 0) return { sent: 0, pruned: 0 }

  const payload = JSON.stringify({
    title: reminder.title,
    body: reminder.body,
    url: reminder.url,
    tag: reminder.slot,
  })

  const expired: string[] = []
  let sent = 0

  // En parallèle : un service de push lent ne doit pas retarder les autres.
  await Promise.all(
    (subs as SubscriptionRow[]).map(async (s) => {
      try {
        await appServer
          .subscribe({
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          })
          .pushTextMessage(payload, {})
        sent++
      } catch (err) {
        if (isGone(err)) expired.push(s.id)
        else console.error(`push vers ${s.endpoint.slice(0, 48)}… :`, err)
      }
    })
  )

  if (expired.length > 0) {
    await db.from('push_subscriptions').delete().in('id', expired)
  }

  return { sent, pruned: expired.length }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))

    if (body?.test === true) {
      const result = await pushToAll(TEST_REMINDER)
      return Response.json({ mode: 'test', ...result })
    }

    const now = new Date()
    const reminder = dueReminder(now)
    if (!reminder) {
      return Response.json({ mode: 'cron', at: parisTime(now), due: null })
    }

    // Garde d'idempotence : la clé primaire (jour, créneau) fait échouer la
    // seconde insertion, et on n'envoie rien de plus. Sans elle, une exécution
    // rejouée doublerait la notification.
    const day = parisDay(now)
    const { error: claimError } = await db
      .from('reminder_log')
      .insert({ day, slot: reminder.slot })

    if (claimError) {
      // 23505 = violation d'unicité : le rappel est déjà parti cette minute.
      if (claimError.code === '23505') {
        return Response.json({ mode: 'cron', due: reminder.slot, skipped: 'déjà envoyé' })
      }
      throw new Error(`journal des rappels : ${claimError.message}`)
    }

    const result = await pushToAll(reminder)
    return Response.json({ mode: 'cron', due: reminder.slot, ...result })
  } catch (err) {
    console.error(err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})

// Exporté pour l'inspection manuelle : `supabase functions invoke` en mode
// test affiche le planning complet dans les logs.
console.log(`send-reminders prêt — ${REMINDERS.length} rappels planifiés`)
