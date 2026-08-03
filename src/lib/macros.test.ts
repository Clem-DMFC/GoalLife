import { describe, expect, test } from 'vitest'
import { macroKcal, macroSplit, wholePercents } from './macros'
import { EMPTY_TOTALS } from './types'

const totals = (protein: number, carbs: number, fat: number) => ({
  kcal: 0,
  protein,
  carbs,
  fat,
})

describe('macroSplit', () => {
  test('répartit sur les calories, pas sur les grammes', () => {
    // 10 g de lipides pèsent 90 kcal contre 40 pour 10 g de protéines.
    const [p, c, f] = macroSplit(totals(10, 10, 10))
    expect([p.kcal, c.kcal, f.kcal]).toEqual([40, 40, 90])
    expect(f.share).toBeGreaterThan(p.share)
    expect(p.share + c.share + f.share).toBeCloseTo(1)
  })

  test('garde les grammes tels quels', () => {
    const [p] = macroSplit(totals(140, 0, 0))
    expect(p.grams).toBe(140)
    expect(p.share).toBe(1)
  })

  test('une journée vide ne divise pas par zéro', () => {
    const slices = macroSplit(EMPTY_TOTALS)
    expect(slices.map((s) => s.share)).toEqual([0, 0, 0])
    expect(macroKcal(EMPTY_TOTALS)).toBe(0)
  })

  test('ignore les valeurs négatives', () => {
    const [p] = macroSplit(totals(-5, 10, 10))
    expect(p.grams).toBe(0)
    expect(p.kcal).toBe(0)
  })
})

describe('wholePercents', () => {
  test('les parts affichées totalisent toujours 100', () => {
    for (const t of [totals(10, 10, 10), totals(33, 33, 33), totals(1, 1, 1), totals(7, 13, 5)]) {
      const pcts = wholePercents(macroSplit(t))
      expect(pcts.reduce((a, b) => a + b, 0)).toBe(100)
    }
  })

  test('une journée vide n’affiche pas de pourcentage inventé', () => {
    expect(wholePercents(macroSplit(EMPTY_TOTALS))).toEqual([0, 0, 0])
  })

  test('une macro seule prend tout', () => {
    expect(wholePercents(macroSplit(totals(100, 0, 0)))).toEqual([100, 0, 0])
  })
})
