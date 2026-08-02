/**
 * Toutes les dates sont manipulées en "jour local" au format YYYY-MM-DD,
 * jamais en UTC — sinon une saisie du soir bascule sur le lendemain.
 */

export function toISODay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return toISODay(new Date())
}

export function fromISODay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, delta: number): string {
  const d = fromISODay(iso)
  d.setDate(d.getDate() + delta)
  return toISODay(d)
}

/** Différence en jours entre deux jours ISO (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = fromISODay(b).getTime() - fromISODay(a).getTime()
  return Math.round(ms / 86400000)
}

const LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const SHORT = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' })

/** "Aujourd’hui", "Hier", sinon "lundi 3 février". */
export function labelDay(iso: string): string {
  const t = today()
  if (iso === t) return "Aujourd’hui"
  if (iso === addDays(t, -1)) return 'Hier'
  if (iso === addDays(t, 1)) return 'Demain'
  return LONG.format(fromISODay(iso))
}

export function labelShort(iso: string): string {
  return SHORT.format(fromISODay(iso))
}

const COMPACT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })

/** Version courte pour les listes : "Aujourd’hui", "Hier", sinon "ven. 31/07". */
export function labelCompact(iso: string): string {
  const t = today()
  if (iso === t) return "Aujourd’hui"
  if (iso === addDays(t, -1)) return 'Hier'
  return COMPACT.format(fromISODay(iso))
}
