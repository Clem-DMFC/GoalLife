import { describe, expect, test } from 'vitest'
import { searchLocalFoods } from './localFoods'

describe('searchLocalFoods', () => {
  test('trouve les quatre aliments du test manuel du prompt', () => {
    // "œuf", "riz", "poulet", "pâtes" doivent tous répondre, instantanément.
    expect(searchLocalFoods('œuf').length).toBeGreaterThan(0)
    expect(searchLocalFoods('riz').length).toBeGreaterThan(0)
    expect(searchLocalFoods('poulet').length).toBeGreaterThan(0)
    expect(searchLocalFoods('pâtes').length).toBeGreaterThan(0)
  })

  test('insensible à la casse', () => {
    expect(searchLocalFoods('POULET')).toEqual(searchLocalFoods('poulet'))
    expect(searchLocalFoods('Riz')).toEqual(searchLocalFoods('riz'))
  })

  test('insensible aux accents, dans les deux sens', () => {
    expect(searchLocalFoods('oeuf')).toEqual(searchLocalFoods('œuf'))
    expect(searchLocalFoods('epinards').length).toBeGreaterThan(0)
    expect(searchLocalFoods('épinards').length).toBeGreaterThan(0)
  })

  test('« riz » renvoie le cru et le cuit, jamais un seul des deux', () => {
    const names = searchLocalFoods('riz').map((f) => f.name)
    expect(names).toContain('Riz blanc, cru')
    expect(names).toContain('Riz blanc, cuit')
  })

  test('les correspondances en tête de nom passent avant les correspondances internes', () => {
    // "pomme" doit remonter "Pomme" avant "Pomme de terre, crue"... en fait
    // l'inverse : les deux commencent par "pomme", donc l'ordre suit la base.
    // On vérifie plutôt un cas net : un alias en tête bat une sous-chaîne.
    const results = searchLocalFoods('lait')
    expect(results[0].name).toMatch(/^Lait/)
  })

  test('un alias fait remonter l’aliment même si le nom affiché diffère', () => {
    const results = searchLocalFoods('blanc de poulet')
    expect(results.map((f) => f.name)).toContain('Poulet, filet, cru')
  })

  test('une saisie trop courte ne renvoie rien, sans lever d’erreur', () => {
    expect(searchLocalFoods('r')).toEqual([])
    expect(searchLocalFoods('')).toEqual([])
    expect(searchLocalFoods('   ')).toEqual([])
  })

  test('chaque résultat local porte la source "base" et une catégorie en guise de sous-titre', () => {
    const [first] = searchLocalFoods('poulet')
    expect(first.source).toBe('base')
    expect(first.brand).toBe('Viande')
    expect(first.servingGrams).toBeNull()
  })

  test('le code est préfixé pour ne jamais coïncider avec un code-barres OFF', () => {
    const [first] = searchLocalFoods('riz')
    expect(first.code.startsWith('base:')).toBe(true)
  })

  test('aucun résultat pour un terme absent de la base', () => {
    expect(searchLocalFoods('licorne')).toEqual([])
  })
})
