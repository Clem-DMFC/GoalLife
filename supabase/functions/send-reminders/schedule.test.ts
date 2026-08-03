import { describe, expect, test } from 'vitest'
import { dueReminder, parisDay, parisTime, REMINDERS } from './schedule'
import { REMINDER_TIMES } from '../../../src/lib/reminders'

describe('parisTime', () => {
  /*
   * Le cœur du sujet : l'heure de Paris n'est pas à un décalage fixe de UTC.
   * Ces deux cas échoueraient avec un offset codé en dur, et c'est exactement
   * l'erreur qui décalerait tous les rappels d'une heure la moitié de l'année.
   */
  test('applique l’heure d’hiver (UTC+1)', () => {
    expect(parisTime(new Date('2026-01-15T06:25:00Z'))).toBe('07:25')
  })

  test('applique l’heure d’été (UTC+2)', () => {
    expect(parisTime(new Date('2026-07-15T05:25:00Z'))).toBe('07:25')
  })

  test('bascule au bon moment le dernier dimanche de mars', () => {
    // 2026-03-29 01:00 UTC : Paris passe de 02:00 à 03:00.
    expect(parisTime(new Date('2026-03-29T00:59:00Z'))).toBe('01:59')
    expect(parisTime(new Date('2026-03-29T01:00:00Z'))).toBe('03:00')
  })

  test('minuit se lit 00:00, jamais 24:00', () => {
    expect(parisTime(new Date('2026-01-14T23:00:00Z'))).toBe('00:00')
  })
})

describe('parisDay', () => {
  test('suit le jour de Paris, pas celui d’UTC', () => {
    // 23 h 30 UTC en été = 01 h 30 le lendemain à Paris.
    expect(parisDay(new Date('2026-07-15T23:30:00Z'))).toBe('2026-07-16')
    expect(parisDay(new Date('2026-07-15T09:00:00Z'))).toBe('2026-07-15')
  })
})

describe('dueReminder', () => {
  test('rend le rappel de la minute exacte', () => {
    expect(dueReminder(new Date('2026-01-15T06:25:00Z'))?.slot).toBe('weight')
    expect(dueReminder(new Date('2026-01-15T11:15:00Z'))?.slot).toBe('dejeuner')
    // 21:00 Paris en hiver = 20:00 UTC.
    expect(dueReminder(new Date('2026-01-15T20:00:00Z'))?.slot).toBe('water_evening')
  })

  test('ne rend rien en dehors des créneaux', () => {
    expect(dueReminder(new Date('2026-01-15T06:26:00Z'))).toBeNull()
    expect(dueReminder(new Date('2026-01-15T02:00:00Z'))).toBeNull()
  })

  test('les mêmes créneaux tombent aux mêmes heures locales en été', () => {
    // 07:25 Paris en été = 05:25 UTC.
    expect(dueReminder(new Date('2026-07-15T05:25:00Z'))?.slot).toBe('weight')
  })
})

describe('planning', () => {
  test('les créneaux sont uniques — la clé d’idempotence en dépend', () => {
    const slots = REMINDERS.map((r) => r.slot)
    expect(new Set(slots).size).toBe(slots.length)
  })

  test('les horaires sont bien formés et ordonnés', () => {
    const times = REMINDERS.map((r) => r.at)
    expect(times.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))).toBe(true)
    expect([...times].sort()).toEqual(times)
  })

  test('chaque rappel porte un deep link que l’app sait lire', () => {
    for (const r of REMINDERS) {
      expect(r.url.startsWith('/?go=')).toBe(true)
      expect(r.title.length).toBeGreaterThan(0)
      expect(r.body.length).toBeGreaterThan(0)
    }
  })

  /*
   * Les réglages affichent leur propre liste d'horaires, parce que l'Edge
   * Function doit rester autonome pour être déployable seule. Ce test empêche
   * les deux de diverger en silence.
   */
  test('les horaires affichés dans les réglages collent au planning réel', () => {
    expect(REMINDER_TIMES.map((r) => r.at)).toEqual(REMINDERS.map((r) => r.at))
  })
})
