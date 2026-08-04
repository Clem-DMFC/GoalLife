import { describe, expect, test } from 'vitest'
import {
  ACTIVITY_FACTORS,
  bmr,
  computeTargets,
  GOAL_DELTAS,
  KCAL_FLOOR,
  tdee,
  type Activity,
  type Goal,
  type Profile,
} from './nutrition'

const homme: Profile = {
  sex: 'homme',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: 'modere',
  goal: 'maintien',
}

const femme: Profile = {
  sex: 'femme',
  age: 30,
  height_cm: 165,
  weight_kg: 60,
  activity: 'modere',
  goal: 'maintien',
}

describe('bmr — Mifflin-St Jeor', () => {
  test('homme : base + 5', () => {
    // 10×80 + 6.25×180 − 5×30 + 5 = 800 + 1125 − 150 + 5
    expect(bmr(homme)).toBe(1780)
  })

  test('femme : base − 161', () => {
    // 10×60 + 6.25×165 − 5×30 − 161 = 600 + 1031.25 − 150 − 161
    expect(bmr(femme)).toBeCloseTo(1320.25)
  })

  test('à profil identique, l’écart homme/femme est de 166 kcal', () => {
    expect(bmr({ ...femme, sex: 'homme' }) - bmr(femme)).toBe(166)
  })
})

describe('tdee', () => {
  test('multiplie par le facteur d’activité', () => {
    expect(tdee({ ...homme, activity: 'sedentaire' })).toBeCloseTo(1780 * 1.2)
    expect(tdee({ ...homme, activity: 'tres_actif' })).toBeCloseTo(1780 * 1.9)
  })

  test('les cinq facteurs sont ceux du barème', () => {
    expect(ACTIVITY_FACTORS).toEqual({
      sedentaire: 1.2,
      leger: 1.375,
      modere: 1.55,
      actif: 1.725,
      tres_actif: 1.9,
    })
  })
})

describe('computeTargets — calories par objectif', () => {
  // TDEE homme modéré = 1780 × 1.55 = 2759
  test('maintien : le TDEE, arrondi à la dizaine', () => {
    expect(computeTargets({ ...homme, goal: 'maintien' }).kcal).toBe(2760)
  })

  test('perte : −18 %', () => {
    // 2759 × 0.82 = 2262.38 → 2260
    expect(computeTargets({ ...homme, goal: 'perte' }).kcal).toBe(2260)
  })

  test('muscle : +12 %', () => {
    // 2759 × 1.12 = 3090.08 → 3090
    expect(computeTargets({ ...homme, goal: 'muscle' }).kcal).toBe(3090)
  })

  test('recomposition : à l’entretien, comme le maintien', () => {
    expect(computeTargets({ ...homme, goal: 'recomp' }).kcal).toBe(
      computeTargets({ ...homme, goal: 'maintien' }).kcal
    )
    expect(GOAL_DELTAS.recomp).toBe(0)
  })

  test('les calories tombent toujours sur une dizaine', () => {
    const goals: Goal[] = ['perte', 'maintien', 'muscle', 'recomp']
    const activities: Activity[] = ['sedentaire', 'leger', 'modere', 'actif', 'tres_actif']
    for (const goal of goals) {
      for (const activity of activities) {
        expect(computeTargets({ ...homme, goal, activity }).kcal % 10).toBe(0)
        expect(computeTargets({ ...femme, goal, activity }).kcal % 10).toBe(0)
      }
    }
  })
})

describe('computeTargets — macros', () => {
  test('protéines à 1.9 g/kg, lipides à 0.9 g/kg', () => {
    const t = computeTargets(homme)
    expect(t.protein).toBe(152) // 1.9 × 80
    expect(t.fat).toBe(72) // 0.9 × 80
  })

  test('les glucides prennent le reste des calories', () => {
    const t = computeTargets(homme)
    // (2760 − 152×4 − 72×9) / 4 = (2760 − 608 − 648) / 4 = 376
    expect(t.carbs).toBe(376)
  })

  test('les macros retombent sur les calories visées', () => {
    const t = computeTargets(homme)
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeCloseTo(t.kcal, -1)
  })

  test('les macros sont entières', () => {
    const t = computeTargets(femme)
    for (const v of [t.protein, t.carbs, t.fat]) expect(Number.isInteger(v)).toBe(true)
  })

  test('les protéines suivent le poids, pas les calories', () => {
    // Même personne, objectif différent : les protéines ne bougent pas.
    const perte = computeTargets({ ...homme, goal: 'perte' })
    const muscle = computeTargets({ ...homme, goal: 'muscle' })
    expect(perte.protein).toBe(muscle.protein)
    expect(perte.fat).toBe(muscle.fat)
    // Seuls les glucides absorbent l'écart.
    expect(muscle.carbs).toBeGreaterThan(perte.carbs)
  })
})

describe('computeTargets — plancher calorique', () => {
  test('une femme de petit gabarit en perte ne descend pas sous 1200', () => {
    const petite: Profile = {
      sex: 'femme',
      age: 55,
      height_cm: 152,
      weight_kg: 45,
      activity: 'sedentaire',
      goal: 'perte',
    }
    // Le calcul brut tombe sous le plancher : il est relevé, et signalé.
    const t = computeTargets(petite)
    expect(t.kcal).toBe(1200)
    expect(t.floored).toBe(true)
  })

  test('un homme de petit gabarit en perte ne descend pas sous 1500', () => {
    const petit: Profile = {
      sex: 'homme',
      age: 60,
      height_cm: 160,
      weight_kg: 50,
      activity: 'sedentaire',
      goal: 'perte',
    }
    const t = computeTargets(petit)
    expect(t.kcal).toBe(1500)
    expect(t.floored).toBe(true)
  })

  test('un profil ordinaire n’est pas planchéifié', () => {
    expect(computeTargets({ ...homme, goal: 'perte' }).floored).toBe(false)
    expect(computeTargets({ ...femme, goal: 'perte' }).floored).toBe(false)
  })

  test('aucun profil valide ne passe sous son plancher', () => {
    const goals: Goal[] = ['perte', 'maintien', 'muscle', 'recomp']
    for (const sex of ['homme', 'femme'] as const) {
      for (const goal of goals) {
        for (const age of [14, 40, 100]) {
          for (const weight_kg of [30, 80, 250]) {
            const t = computeTargets({
              sex,
              age,
              height_cm: 120,
              weight_kg,
              activity: 'sedentaire',
              goal,
            })
            expect(t.kcal).toBeGreaterThanOrEqual(KCAL_FLOOR[sex])
          }
        }
      }
    }
  })

  /*
   * Chez un gabarit très lourd et sédentaire en déficit, protéines et lipides
   * suffisent à dépasser le total calorique. Les glucides ne doivent pas
   * devenir négatifs : les anneaux afficheraient un objectif absurde.
   */
  test('les glucides ne partent jamais dans le négatif', () => {
    const lourd: Profile = {
      sex: 'homme',
      age: 45,
      height_cm: 170,
      weight_kg: 150,
      activity: 'sedentaire',
      goal: 'perte',
    }
    expect(computeTargets(lourd).carbs).toBe(0)

    for (const weight_kg of [30, 60, 100, 150, 200, 250]) {
      expect(computeTargets({ ...lourd, weight_kg }).carbs).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('computeTargets — hydratation', () => {
  test('conserve l’objectif d’eau existant, que le calcul ne touche pas', () => {
    expect(computeTargets(homme, { water_ml: 2500 }).water_ml).toBe(2500)
  })

  test('retombe sur la valeur par défaut pour un nouveau compte', () => {
    expect(computeTargets(homme).water_ml).toBe(3000)
  })
})
