import { describe, expect, test } from 'vitest'
import { readDeepLink } from './deeplink'
import { REMINDERS } from '../../supabase/functions/send-reminders/schedule'

describe('readDeepLink', () => {
  test('ouvre l’écran Poids', () => {
    expect(readDeepLink('?go=weight')).toEqual({ tab: 'weight' })
  })

  test('ouvre le jour en pointant l’eau', () => {
    expect(readDeepLink('?go=water')).toEqual({ tab: 'today', focusWater: true })
  })

  test('ouvre la feuille d’ajout avec le repas voulu', () => {
    expect(readDeepLink('?go=add&meal=dejeuner')).toEqual({
      tab: 'today',
      openAdd: true,
      meal: 'dejeuner',
    })
  })

  test('un repas inconnu n’empêche pas la feuille de s’ouvrir', () => {
    // Elle retombera sur la suggestion horaire — mieux que ne rien ouvrir.
    expect(readDeepLink('?go=add&meal=brunch')).toEqual({
      tab: 'today',
      openAdd: true,
      meal: undefined,
    })
    expect(readDeepLink('?go=add')).toEqual({ tab: 'today', openAdd: true, meal: undefined })
  })

  test('sans paramètre, pas de deep link', () => {
    expect(readDeepLink('')).toBeNull()
    expect(readDeepLink('?other=1')).toBeNull()
    expect(readDeepLink('?go=inconnu')).toBeNull()
  })

  /*
   * Le lien est écrit dans l'Edge Function et lu ici : si l'un des deux
   * change de vocabulaire, le clic sur un rappel retombe sur l'accueil sans
   * que rien ne casse visiblement. D'où cette vérification croisée.
   */
  test('tous les liens du planning sont compris par l’app', () => {
    for (const reminder of REMINDERS) {
      const search = reminder.url.slice(reminder.url.indexOf('?'))
      expect(readDeepLink(search), `${reminder.slot} → ${reminder.url}`).not.toBeNull()
    }
  })

  test('le rappel de pesée mène bien au poids, celui du dîner au dîner', () => {
    const bySlot = Object.fromEntries(REMINDERS.map((r) => [r.slot, r.url]))
    expect(readDeepLink(bySlot.weight.slice(1))).toEqual({ tab: 'weight' })
    expect(readDeepLink(bySlot.diner.slice(1))).toEqual({
      tab: 'today',
      openAdd: true,
      meal: 'diner',
    })
    expect(readDeepLink(bySlot.water_morning.slice(1))).toEqual({
      tab: 'today',
      focusWater: true,
    })
  })
})
