/**
 * Planning des rappels et lecture de l'heure de Paris.
 *
 * Ce module ne touche ni au réseau ni à Deno : il est importable tel quel par
 * les tests de l'app (`npm test`), qui vérifient notamment le passage
 * heure d'été / heure d'hiver.
 */

export type Reminder = {
  /** Identifiant stable du créneau, utilisé comme clé d'idempotence. */
  slot: string
  /** Heure de déclenchement, en heure de Paris. */
  at: `${number}${number}:${number}${number}`
  title: string
  body: string
  /** Chemin ouvert au clic sur la notification. */
  url: string
}

/**
 * Les huit rappels de la journée, en heure de Paris.
 *
 * `url` porte le deep link : l'app le lit au démarrage pour ouvrir l'écran
 * concerné, et pré-sélectionner le repas quand il y en a un.
 */
export const REMINDERS: Reminder[] = [
  {
    slot: 'weight',
    at: '07:25',
    title: '⚖️ Pesée du matin',
    body: 'À jeun, avant le petit-déj — c\'est le moment le plus fiable.',
    url: '/?go=weight',
  },
  {
    slot: 'petit_dej',
    at: '07:35',
    title: '🥣 Petit-déjeuner',
    body: 'Note ton petit-déj pendant que tu y es.',
    url: '/?go=add&meal=petit_dej',
  },
  {
    slot: 'water_morning',
    at: '10:00',
    title: '💧 Hydratation',
    body: "C'est l'heure de boire un verre d'eau.",
    url: '/?go=water',
  },
  {
    slot: 'dejeuner',
    at: '12:15',
    title: '🍽️ Déjeuner',
    body: 'Pense à enregistrer ton déjeuner.',
    url: '/?go=add&meal=dejeuner',
  },
  {
    slot: 'water_afternoon',
    at: '15:00',
    title: '💧 Hydratation',
    body: 'Un verre d\'eau, et on repart.',
    url: '/?go=water',
  },
  {
    slot: 'collation',
    at: '16:10',
    title: '🥜 Collation',
    body: 'Une collation ? Note-la pour garder le compte juste.',
    url: '/?go=add&meal=collation',
  },
  {
    slot: 'diner',
    at: '19:15',
    title: '🍲 Dîner',
    body: 'Dernier repas de la journée à enregistrer.',
    url: '/?go=add&meal=diner',
  },
  {
    slot: 'water_evening',
    at: '21:00',
    title: '💧 Hydratation',
    body: 'Dernier verre pour boucler ton objectif du jour.',
    url: '/?go=water',
  },
]

/**
 * Heure courante à Paris, au format `HH:MM`.
 *
 * `Intl` porte la base de fuseaux : le passage heure d'été / heure d'hiver est
 * géré tout seul. Coder un décalage UTC en dur décalerait tous les rappels
 * d'une heure la moitié de l'année.
 *
 * `hourCycle: 'h23'` évite le « 24:00 » que certaines locales renvoient à
 * minuit.
 */
export function parisTime(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('hour')}:${get('minute')}`
}

/** Jour courant à Paris (`YYYY-MM-DD`), clé du journal d'envoi. */
export function parisDay(now: Date = new Date()): string {
  // `en-CA` formate en ISO, ce qui évite de recomposer les morceaux à la main.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * Le rappel dû à cette minute, s'il y en a un.
 *
 * La comparaison est exacte : le cron tourne chaque minute, et un créneau raté
 * vaut mieux qu'un rappel envoyé avec vingt minutes de retard.
 */
export function dueReminder(now: Date = new Date()): Reminder | null {
  const hhmm = parisTime(now)
  return REMINDERS.find((r) => r.at === hhmm) ?? null
}
