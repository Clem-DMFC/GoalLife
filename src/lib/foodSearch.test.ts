import { describe, expect, test } from 'vitest'
import { mergeFoods } from './foodSearch'
import type { Food } from './openfoodfacts'

const food = (name: string, source: Food['source'], brand = ''): Food => ({
  code: `${source}:${name}`,
  name,
  brand,
  per100: { kcal: 100, protein: 10, carbs: 10, fat: 2 },
  servingGrams: null,
  source,
})

describe('mergeFoods', () => {
  test('la base locale passe en tête', () => {
    const off = [food('Riz', 'off', 'Marque X')]
    const local = [food('Poulet, filet, cru', 'base')]
    const merged = mergeFoods(local, off)
    expect(merged[0].source).toBe('base')
    expect(merged.map((f) => f.name)).toEqual(['Poulet, filet, cru', 'Riz'])
  })

  test('un doublon exact de nom, venu d’OFF, est écarté', () => {
    const local = [food('Riz blanc, cuit', 'base')]
    const off = [food('Riz blanc, cuit', 'off', 'Marque X')]
    expect(mergeFoods(local, off)).toEqual([local[0]])
  })

  test('la dédoublonnage ignore casse et accents', () => {
    const local = [food('Épinards, crus', 'base')]
    const off = [food('epinards, crus', 'off')]
    expect(mergeFoods(local, off)).toHaveLength(1)
  })

  test('une variante de marque n’est pas un doublon : elle reste', () => {
    const local = [food('Yaourt nature', 'base')]
    const off = [food('Yaourt nature Danone', 'off', 'Danone')]
    expect(mergeFoods(local, off)).toHaveLength(2)
  })

  test('sans base locale, les résultats OFF passent tels quels', () => {
    const off = [food('Houmous', 'off', 'Marque Y')]
    expect(mergeFoods([], off)).toEqual(off)
  })

  test('sans résultat OFF, la base locale seule suffit', () => {
    const local = [food('Riz blanc, cru', 'base')]
    expect(mergeFoods(local, [])).toEqual(local)
  })

  test('deux sources vides donnent une liste vide', () => {
    expect(mergeFoods([], [])).toEqual([])
  })
})
