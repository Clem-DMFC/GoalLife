import type { MacroTotals } from '../lib/types'

/**
 * Base locale d'aliments courants : le socle fiable pour les aliments bruts
 * (œufs, viandes, féculents, légumes…), qu'Open Food Facts couvre mal — c'est
 * une base de produits emballés, pas d'ingrédients de base. Une recherche
 * "poulet" y renvoie soit rien, soit des marques au hasard.
 *
 * Recherchée en mémoire, sans réseau : la réponse est instantanée et ne
 * dépend jamais de l'état de la connexion.
 *
 * Valeurs pour 100 g, réalistes et conformes aux ordres de grandeur de la
 * table Ciqual (ANSES) / USDA FoodData Central — reprises de leur consensus
 * public plutôt qu'extraites en direct de la base (réseau indisponible
 * depuis l'environnement de build). À ajuster au besoin pour un aliment
 * précis : ce sont des valeurs de référence, pas une mesure de laboratoire.
 */

export type BaseFoodCategory =
  | 'oeuf'
  | 'viande'
  | 'poisson'
  | 'feculent'
  | 'legumineuse'
  | 'laitier'
  | 'fruit'
  | 'legume'
  | 'oleagineux'
  | 'matiere_grasse'
  | 'autre'

export const CATEGORY_LABELS: Record<BaseFoodCategory, string> = {
  oeuf: 'Œuf',
  viande: 'Viande',
  poisson: 'Poisson',
  feculent: 'Féculent',
  legumineuse: 'Légumineuse',
  laitier: 'Laitier',
  fruit: 'Fruit',
  legume: 'Légume',
  oleagineux: 'Oléagineux',
  matiere_grasse: 'Matière grasse',
  autre: 'Autre',
}

export type BaseFoodEntry = {
  /** Slug stable, jamais affiché — sert de clé et de code produit interne. */
  id: string
  name: string
  /** Variantes de recherche : sans accent, singulier/pluriel, abréviations. */
  aliases?: string[]
  category: BaseFoodCategory
  per100: MacroTotals
  source: 'base'
}

const entry = (
  id: string,
  name: string,
  category: BaseFoodCategory,
  per100: MacroTotals,
  aliases?: string[]
): BaseFoodEntry => ({ id, name, category, per100, aliases, source: 'base' })

export const BASE_FOODS: BaseFoodEntry[] = [
  // --- Œufs ---------------------------------------------------------------
  entry('oeuf-cru', 'Œuf entier, cru', 'oeuf', { kcal: 143, protein: 12.5, carbs: 0.7, fat: 9.9 }, [
    'oeufs',
    'egg',
  ]),
  entry('oeuf-dur', 'Œuf dur, cuit', 'oeuf', { kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6 }, [
    'oeuf cuit',
    'oeufs durs',
  ]),

  // --- Viandes --------------------------------------------------------------
  entry(
    'poulet-blanc-cru',
    'Poulet, filet, cru',
    'viande',
    { kcal: 120, protein: 22, carbs: 0, fat: 2.8 },
    ['blanc de poulet', 'filet de poulet', 'escalope de poulet crue']
  ),
  entry(
    'poulet-blanc-cuit',
    'Poulet, filet, cuit (grillé)',
    'viande',
    { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
    ['blanc de poulet cuit', 'poulet grillé', 'escalope de poulet cuite']
  ),
  entry(
    'poulet-cuisse-cuite',
    'Poulet, cuisse, cuite',
    'viande',
    { kcal: 209, protein: 26, carbs: 0, fat: 10.9 },
    ['cuisse de poulet']
  ),
  entry(
    'boeuf-hache-5-cru',
    'Bœuf haché 5% MG, cru',
    'viande',
    { kcal: 132, protein: 20, carbs: 0, fat: 5 },
    ['steak haché 5%', 'boeuf haché maigre', 'viande hachée maigre']
  ),
  entry(
    'boeuf-hache-15-cru',
    'Bœuf haché 15% MG, cru',
    'viande',
    { kcal: 215, protein: 18, carbs: 0, fat: 15 },
    ['steak haché 15%', 'boeuf haché']
  ),
  entry(
    'boeuf-steak-cuit',
    'Bœuf, steak, cuit',
    'viande',
    { kcal: 172, protein: 26, carbs: 0, fat: 7 },
    ['steak de boeuf', 'boeuf grillé', 'entrecôte']
  ),
  entry(
    'porc-filet-cru',
    'Porc, filet mignon, cru',
    'viande',
    { kcal: 143, protein: 21, carbs: 0, fat: 6 },
    ['filet de porc', 'porc']
  ),
  entry(
    'dinde-blanc-cru',
    'Dinde, filet, cru',
    'viande',
    { kcal: 104, protein: 24, carbs: 0, fat: 1 },
    ['blanc de dinde', 'escalope de dinde']
  ),
  entry(
    'jambon-blanc',
    'Jambon blanc, cuit dégraissé',
    'viande',
    { kcal: 107, protein: 20, carbs: 1, fat: 2.5 },
    ['jambon']
  ),

  // --- Poissons ---------------------------------------------------------
  entry('thon-cru', 'Thon, cru', 'poisson', { kcal: 108, protein: 23, carbs: 0, fat: 1 }, [
    'thon frais',
  ]),
  entry(
    'thon-boite',
    'Thon au naturel, égoutté',
    'poisson',
    { kcal: 116, protein: 26, carbs: 0, fat: 1 },
    ['thon en boîte', 'thon nature', 'thon boite']
  ),
  entry('saumon-cru', 'Saumon, cru', 'poisson', { kcal: 182, protein: 20, carbs: 0, fat: 11 }, [
    'saumon frais',
  ]),
  entry(
    'saumon-cuit',
    'Saumon, cuit',
    'poisson',
    { kcal: 206, protein: 22.1, carbs: 0, fat: 12.4 },
    ['saumon grillé', 'saumon vapeur']
  ),
  entry(
    'cabillaud-cru',
    'Cabillaud, cru',
    'poisson',
    { kcal: 82, protein: 18, carbs: 0, fat: 0.7 },
    ['cabillaud', 'morue']
  ),

  // --- Féculents (cru/cuit distingués : source d'erreur majeure) --------
  entry('riz-blanc-cru', 'Riz blanc, cru', 'feculent', { kcal: 349, protein: 7.1, carbs: 77.1, fat: 0.6 }, [
    'riz',
  ]),
  entry(
    'riz-blanc-cuit',
    'Riz blanc, cuit',
    'feculent',
    { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
    ['riz cuit']
  ),
  entry(
    'riz-complet-cru',
    'Riz complet, cru',
    'feculent',
    { kcal: 350, protein: 7.5, carbs: 73, fat: 2.7 },
    ['riz brun cru', 'riz complet']
  ),
  entry(
    'riz-complet-cuit',
    'Riz complet, cuit',
    'feculent',
    { kcal: 123, protein: 2.7, carbs: 25.8, fat: 1 },
    ['riz brun cuit', 'riz complet cuit']
  ),
  entry('pates-cuites', 'Pâtes, cuites', 'feculent', { kcal: 131, protein: 5, carbs: 25, fat: 1.1 }, [
    'pates',
    'pâtes blanches',
    'spaghetti cuit',
  ]),
  entry(
    'pates-completes-cuites',
    'Pâtes complètes, cuites',
    'feculent',
    { kcal: 124, protein: 5, carbs: 25, fat: 1 },
    ['pates completes', 'pâtes intégrales']
  ),
  entry(
    'pomme-de-terre-crue',
    'Pomme de terre, crue',
    'feculent',
    { kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
    ['patate']
  ),
  entry(
    'pomme-de-terre-cuite',
    'Pomme de terre, cuite (à l’eau)',
    'feculent',
    { kcal: 79, protein: 1.7, carbs: 18, fat: 0.1 },
    ['pomme de terre vapeur', 'patate cuite', 'pomme de terre bouillie']
  ),
  entry('pain-blanc', 'Pain blanc / baguette', 'feculent', { kcal: 266, protein: 8.5, carbs: 55, fat: 1 }, [
    'baguette',
    'pain',
  ]),
  entry(
    'pain-complet',
    'Pain complet',
    'feculent',
    { kcal: 246, protein: 10, carbs: 44, fat: 2.5 },
    ['pain complet', 'pain intégral']
  ),
  entry(
    'flocons-avoine',
    'Flocons d’avoine',
    'feculent',
    { kcal: 375, protein: 13.5, carbs: 60, fat: 7 },
    ['avoine', 'porridge cru', 'oatmeal']
  ),
  entry('quinoa-cru', 'Quinoa, cru', 'feculent', { kcal: 368, protein: 14, carbs: 64, fat: 6 }, [
    'quinoa',
  ]),
  entry(
    'quinoa-cuit',
    'Quinoa, cuit',
    'feculent',
    { kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 },
    ['quinoa cuit']
  ),

  // --- Légumineuses -------------------------------------------------------
  entry(
    'lentilles-cuites',
    'Lentilles vertes, cuites',
    'legumineuse',
    { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
    ['lentilles']
  ),
  entry(
    'lentilles-corail-cuites',
    'Lentilles corail, cuites',
    'legumineuse',
    { kcal: 100, protein: 7.6, carbs: 17, fat: 0.4 },
    ['lentilles corail']
  ),
  entry(
    'pois-chiches-cuits',
    'Pois chiches, cuits',
    'legumineuse',
    { kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 },
    ['pois chiches']
  ),
  entry(
    'haricots-rouges-cuits',
    'Haricots rouges, cuits',
    'legumineuse',
    { kcal: 127, protein: 8.7, carbs: 22, fat: 0.5 },
    ['haricots rouges']
  ),
  entry(
    'haricots-blancs-cuits',
    'Haricots blancs, cuits',
    'legumineuse',
    { kcal: 139, protein: 9.7, carbs: 23, fat: 0.5 },
    ['haricots blancs']
  ),

  // --- Produits laitiers --------------------------------------------------
  entry(
    'lait-demi-ecreme',
    'Lait demi-écrémé',
    'laitier',
    { kcal: 46, protein: 3.3, carbs: 4.8, fat: 1.6 },
    ['lait']
  ),
  entry('lait-entier', 'Lait entier', 'laitier', { kcal: 64, protein: 3.2, carbs: 4.8, fat: 3.6 }, [
    'lait entier',
  ]),
  entry('yaourt-nature', 'Yaourt nature', 'laitier', { kcal: 61, protein: 3.7, carbs: 4.6, fat: 3.1 }, [
    'yaourt',
    'yogourt',
  ]),
  entry(
    'yaourt-nature-0',
    'Yaourt nature 0%',
    'laitier',
    { kcal: 43, protein: 4.5, carbs: 5.5, fat: 0.2 },
    ['yaourt 0%', 'yaourt maigre']
  ),
  entry('skyr-nature', 'Skyr nature', 'laitier', { kcal: 63, protein: 11, carbs: 4, fat: 0.2 }, [
    'skyr',
  ]),
  entry(
    'fromage-blanc-20',
    'Fromage blanc 20% MG',
    'laitier',
    { kcal: 79, protein: 8, carbs: 4, fat: 3 },
    ['fromage blanc']
  ),
  entry(
    'fromage-blanc-0',
    'Fromage blanc 0%',
    'laitier',
    { kcal: 45, protein: 7.5, carbs: 4, fat: 0.2 },
    ['fromage blanc 0%', 'fromage blanc maigre']
  ),
  entry(
    'cottage-cheese',
    'Cottage cheese',
    'laitier',
    { kcal: 98, protein: 11, carbs: 3.4, fat: 4.3 },
    ['cottage cheese']
  ),
  entry('emmental', 'Emmental', 'laitier', { kcal: 380, protein: 28, carbs: 0, fat: 29 }, [
    'emmental',
  ]),
  entry('comte', 'Comté', 'laitier', { kcal: 407, protein: 27, carbs: 0, fat: 33 }, ['comté']),
  entry('mozzarella', 'Mozzarella', 'laitier', { kcal: 280, protein: 22, carbs: 2, fat: 20 }, [
    'mozzarella',
  ]),
  entry(
    'chevre-frais',
    'Chèvre frais',
    'laitier',
    { kcal: 220, protein: 14, carbs: 3, fat: 17 },
    ['fromage de chèvre', 'chèvre']
  ),
  entry('parmesan', 'Parmesan', 'laitier', { kcal: 392, protein: 35, carbs: 3.2, fat: 26 }, [
    'parmesan',
  ]),

  // --- Fruits ---------------------------------------------------------------
  entry('banane', 'Banane', 'fruit', { kcal: 89, protein: 1.1, carbs: 20.3, fat: 0.3 }),
  entry('pomme', 'Pomme', 'fruit', { kcal: 52, protein: 0.3, carbs: 12, fat: 0.2 }),
  entry('orange', 'Orange', 'fruit', { kcal: 47, protein: 0.9, carbs: 9.3, fat: 0.1 }),
  entry('fraises', 'Fraises', 'fruit', { kcal: 33, protein: 0.7, carbs: 6, fat: 0.3 }, ['fraise']),
  entry('raisin', 'Raisin', 'fruit', { kcal: 69, protein: 0.6, carbs: 16, fat: 0.4 }),
  entry('kiwi', 'Kiwi', 'fruit', { kcal: 61, protein: 1.1, carbs: 12, fat: 0.5 }),
  entry('ananas', 'Ananas', 'fruit', { kcal: 50, protein: 0.5, carbs: 11.5, fat: 0.1 }),
  entry('avocat', 'Avocat', 'fruit', { kcal: 160, protein: 2, carbs: 1.8, fat: 14.7 }),
  entry('mangue', 'Mangue', 'fruit', { kcal: 60, protein: 0.8, carbs: 13.7, fat: 0.4 }),

  // --- Légumes ----------------------------------------------------------
  entry('brocoli-cru', 'Brocoli, cru', 'legume', { kcal: 34, protein: 2.8, carbs: 4, fat: 0.4 }, [
    'brocoli',
  ]),
  entry('brocoli-cuit', 'Brocoli, cuit', 'legume', { kcal: 35, protein: 2.4, carbs: 4.4, fat: 0.6 }, [
    'brocoli cuit',
  ]),
  entry('carotte-crue', 'Carotte, crue', 'legume', { kcal: 41, protein: 0.9, carbs: 8.2, fat: 0.2 }, [
    'carotte',
  ]),
  entry('tomate', 'Tomate', 'legume', { kcal: 18, protein: 0.9, carbs: 3.5, fat: 0.2 }),
  entry(
    'courgette-cuite',
    'Courgette, cuite',
    'legume',
    { kcal: 17, protein: 1.2, carbs: 2.1, fat: 0.3 },
    ['courgette']
  ),
  entry('epinards-crus', 'Épinards, crus', 'legume', { kcal: 23, protein: 2.9, carbs: 1, fat: 0.4 }, [
    'epinards',
    'épinards',
  ]),
  entry('salade-verte', 'Salade verte', 'legume', { kcal: 15, protein: 1.4, carbs: 1.3, fat: 0.2 }, [
    'laitue',
    'salade',
  ]),
  entry('poivron', 'Poivron', 'legume', { kcal: 26, protein: 1, carbs: 4.6, fat: 0.2 }),
  entry('concombre', 'Concombre', 'legume', { kcal: 12, protein: 0.7, carbs: 1.5, fat: 0.1 }),
  entry(
    'champignons',
    'Champignons de Paris',
    'legume',
    { kcal: 22, protein: 3, carbs: 1.3, fat: 0.3 },
    ['champignons', 'champignon']
  ),

  // --- Oléagineux --------------------------------------------------------
  entry('amandes', 'Amandes', 'oleagineux', { kcal: 579, protein: 21, carbs: 22, fat: 50 }, [
    'amande',
  ]),
  entry('noix', 'Noix', 'oleagineux', { kcal: 654, protein: 15, carbs: 14, fat: 65 }),
  entry('noisettes', 'Noisettes', 'oleagineux', { kcal: 628, protein: 15, carbs: 17, fat: 61 }, [
    'noisette',
  ]),
  entry(
    'cacahuetes',
    'Cacahuètes',
    'oleagineux',
    { kcal: 567, protein: 26, carbs: 16, fat: 49 },
    ['arachides', 'cacahuète']
  ),
  entry(
    'beurre-cacahuete',
    'Beurre de cacahuète',
    'oleagineux',
    { kcal: 588, protein: 25, carbs: 20, fat: 50 },
    ['peanut butter', 'beurre de cacahuètes']
  ),

  // --- Matières grasses ---------------------------------------------------
  entry('huile-olive', 'Huile d’olive', 'matiere_grasse', { kcal: 900, protein: 0, carbs: 0, fat: 100 }, [
    'huile olive',
  ]),
  entry(
    'huile-colza',
    'Huile de colza',
    'matiere_grasse',
    { kcal: 900, protein: 0, carbs: 0, fat: 100 },
    ['huile colza']
  ),
  entry(
    'huile-coco',
    'Huile de coco',
    'matiere_grasse',
    { kcal: 892, protein: 0, carbs: 0, fat: 99 },
    ['huile de noix de coco']
  ),
  entry('beurre', 'Beurre', 'matiere_grasse', { kcal: 745, protein: 0.7, carbs: 0.7, fat: 82 }),

  // --- Divers ---------------------------------------------------------------
  entry('tofu-nature', 'Tofu nature', 'autre', { kcal: 76, protein: 8, carbs: 1.9, fat: 4.2 }, [
    'tofu',
  ]),
  entry(
    'whey-generique',
    'Whey (protéine en poudre, générique)',
    'autre',
    { kcal: 380, protein: 75, carbs: 8, fat: 5 },
    ['whey', 'proteine en poudre', 'whey protein', 'protéine']
  ),
  entry('miel', 'Miel', 'autre', { kcal: 304, protein: 0.3, carbs: 76, fat: 0 }),
  entry('sucre', 'Sucre', 'autre', { kcal: 400, protein: 0, carbs: 100, fat: 0 }, ['sucre blanc']),
]
