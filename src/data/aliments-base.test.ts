import { describe, expect, test } from 'vitest'
import { BASE_FOODS, CATEGORY_LABELS } from './aliments-base'

describe('BASE_FOODS — intégrité des données', () => {
  test('couvre la fourchette demandée (60 à 80 aliments)', () => {
    expect(BASE_FOODS.length).toBeGreaterThanOrEqual(60)
    expect(BASE_FOODS.length).toBeLessThanOrEqual(80)
  })

  test('les identifiants sont uniques', () => {
    const ids = BASE_FOODS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('chaque entrée porte des valeurs positives et un nom non vide', () => {
    for (const f of BASE_FOODS) {
      expect(f.name.trim()).not.toBe('')
      expect(f.source).toBe('base')
      expect(CATEGORY_LABELS[f.category]).toBeDefined()
      for (const v of Object.values(f.per100)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(v)).toBe(true)
      }
    }
  })

  test('aucune entrée ne dépasse la densité calorique physique (~900 kcal/100g)', () => {
    // Les huiles pures culminent à 900 : une valeur au-delà trahirait une
    // faute de saisie (kcal en kJ, virgule décalée...).
    for (const f of BASE_FOODS) {
      expect(f.per100.kcal).toBeLessThanOrEqual(920)
    }
  })

  test('les calories sont cohérentes avec les macros, à la marge des fibres près', () => {
    // 1 g de glucides ou de protéines ~4 kcal, 1 g de lipides ~9 kcal. Les
    // fibres et l'alcool créent un écart, d'où une tolérance large plutôt
    // qu'une égalité stricte.
    for (const f of BASE_FOODS) {
      const computed = f.per100.protein * 4 + f.per100.carbs * 4 + f.per100.fat * 9
      expect(Math.abs(computed - f.per100.kcal)).toBeLessThanOrEqual(
        Math.max(15, f.per100.kcal * 0.1)
      )
    }
  })

  test('riz et pâtes distinguent bien cru et cuit, avec le cru nettement plus dense', () => {
    const byId = Object.fromEntries(BASE_FOODS.map((f) => [f.id, f]))
    expect(byId['riz-blanc-cru']).toBeDefined()
    expect(byId['riz-blanc-cuit']).toBeDefined()
    expect(byId['riz-blanc-cru'].per100.kcal).toBeGreaterThan(byId['riz-blanc-cuit'].per100.kcal * 2)
    expect(byId['pates-cuites']).toBeDefined()
  })

  test('couvre les catégories demandées par le prompt', () => {
    const categories = new Set(BASE_FOODS.map((f) => f.category))
    for (const c of ['oeuf', 'viande', 'poisson', 'feculent', 'legumineuse', 'laitier', 'fruit', 'legume', 'oleagineux', 'matiere_grasse']) {
      expect(categories.has(c as never)).toBe(true)
    }
  })
})
