/**
 * Le planning des rappels, tel qu'affiché dans les réglages.
 *
 * La source de vérité reste l'Edge Function
 * (`supabase/functions/send-reminders/schedule.ts`), qui doit rester
 * autonome pour être déployable seule. Cette liste n'existe que pour montrer
 * les horaires à l'utilisateur ; un test croise les deux pour qu'elles ne
 * divergent jamais en silence.
 */
export const REMINDER_TIMES: { at: string; label: string }[] = [
  { at: '07:25', label: 'Pesée du matin' },
  { at: '07:35', label: 'Petit-déjeuner' },
  { at: '10:00', label: 'Hydratation' },
  { at: '12:15', label: 'Déjeuner' },
  { at: '15:00', label: 'Hydratation' },
  { at: '16:10', label: 'Collation' },
  { at: '19:15', label: 'Dîner' },
  { at: '21:00', label: 'Hydratation' },
]
