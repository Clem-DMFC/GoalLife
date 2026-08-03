# Goatly

App perso de suivi nutritionnel pour une prise de muscle : calories, macros et poids.
Mobile-first, pensée pour être installée sur l'écran d'accueil d'un iPhone (PWA) et
utilisée au pouce.

**Stack** : Vite + React + TypeScript, Tailwind CSS, Supabase (auth + Postgres).

---

## Fonctionnalités

**Navigation** — barre d'onglets en bas de l'écran (Jour, Historique, Poids, Réglages) avec
le bouton d'ajout au centre : tout est atteignable au pouce, sans remonter en haut de
l'écran. Les objectifs et la déconnexion sont sur l'écran Réglages.

**Écran « Aujourd'hui »**

- 4 anneaux de progression : calories, protéines, glucides, lipides (total du jour vs objectif).
- **Camembert des macros** : la répartition protéines / glucides / lipides, en parts
  calculées sur les calories (facteurs d'Atwater) et non sur les grammes, avec les grammes
  et le pourcentage de chacune en légende.
- Objectifs éditables (stockés dans `targets`).
- **Recherche d'aliments** dans Open Food Facts : tu tapes un nom, tu choisis la quantité en
  grammes, les macros sont calculées. Gratuit, sans clé d'API.
- **Plats composés** : additionner plusieurs aliments en une recette, enregistrée en favori
  et réutilisable en un tap.
- Trois sources d'ajout rapide : **Raccourcis** (6 presets figés), **Favoris** (tes plats),
  **Récents** (tout ce que tu as saisi ces 30 derniers jours).
- Saisie manuelle : nom + kcal / P / G / L.
- **Entrées groupées par repas** (petit-déj, déjeuner, dîner, collation) avec sous-total
  kcal + protéines par repas et suppression en un tap. Le repas est pré-sélectionné selon
  l'heure à l'ajout ; les entrées antérieures à cette fonctionnalité tombent dans « Autre ».
- **Suivi de l'eau** : une gourde qui se remplit sous les anneaux, ajouts rapides
  +250 / +500 / +750 ml, annulation du dernier ajout ou remise à zéro du jour. L'incrément
  est fait par la fonction SQL `add_water`, pas dans le navigateur.
- **Confirmation à l'ajout** : chaque ajout, copie ou suppression affiche un message court
  (« Skyr ajouté au petit-déj »), et un échec d'écriture le dit au lieu de passer inaperçu.
- **Rappels planifiés** : notifications push à heures fixes (pesée, repas, hydratation),
  activables depuis les Réglages. Un clic ouvre directement l'écran concerné. Voir
  [la doc de l'Edge Function](supabase/functions/send-reminders/README.md) pour la mise en
  service.
- **Duplication** : copier un repas, refaire un repas de la veille, ou dupliquer une
  journée entière depuis l'historique (alimentaire seul — ni eau ni poids).
- Navigation entre les jours (flèches ‹ ›), pour consulter ou compléter un jour passé.
- Moyenne des calories sur les 7 derniers jours renseignés.
- Historique des 14 derniers jours — un tap sur une ligne ouvre ce jour-là.

**Écran « Poids »**

- Saisie de la pesée du matin (une par jour, modifiable).
- Courbe des 14 dernières pesées (SVG écrit à la main, aucune lib de charts).
- Variation ramenée à 7 jours + indication « dans la cible / hors cible ».
- Rappel de la cible : +0,25 à +0,5 kg par semaine.

---

## Installation

Prérequis : Node 18+.

```bash
npm install
cp .env.example .env   # puis remplir les deux variables (voir ci-dessous)
npm run dev            # http://localhost:5173
```

Build de production :

```bash
npm run build    # sort dans dist/
npm run preview  # sert dist/ en local pour vérifier
```

Tests (Vitest + jsdom) :

```bash
npm test         # logique de recherche, répartition des macros, verrou de scroll, feuilles
```

---

## Configuration Supabase

1. **Créer le projet** sur [supabase.com](https://supabase.com) (plan gratuit suffisant).

2. **Créer les tables** : ouvrir _SQL Editor_ → _New query_, coller le contenu de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), puis _Run_.
   Recommencer dans l'ordre avec [`0002_favorites.sql`](supabase/migrations/0002_favorites.sql),
   [`0003_meals_water.sql`](supabase/migrations/0003_meals_water.sql) et
   [`0004_water_increment.sql`](supabase/migrations/0004_water_increment.sql).
   Les scripts créent les 5 tables (`targets`, `food_entries`, `weights`, `favorites`,
   `water`), activent RLS et posent les policies : chaque ligne n'est lisible et modifiable
   que par son propriétaire (`user_id = auth.uid()`).

   Les migrations sont à rejouer **avant** de déployer le front correspondant : le build
   qui suit interroge les nouvelles colonnes.

3. **Récupérer les clés** : _Project Settings_ → _API_. Reporter dans `.env` :

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

   La clé `anon` est publique par nature : c'est RLS qui protège les données, pas le secret
   de la clé. Ne jamais mettre la clé `service_role` dans le front.

4. **Activer l'auth par email** : _Authentication_ → _Providers_ → _Email_ doit être activé.
   L'app utilise le code à 6 chiffres (OTP), pas le magic link — voir plus bas.

5. Optionnel, comme l'app est perso : _Authentication_ → _Sign In / Providers_ →
   décocher **Allow new users to sign up** une fois ton compte créé, pour que personne
   d'autre ne puisse s'inscrire.

### Pourquoi un code à 6 chiffres et pas un magic link

Un magic link cliqué depuis l'app Mail ouvre **Safari**, pas la PWA installée : la session
atterrit dans le mauvais « navigateur » et l'app sur l'écran d'accueil reste déconnectée.
Le flow OTP (saisie de l'email → réception d'un code → saisie du code dans l'app) reste
entièrement dans la PWA.

Côté Supabase, le template d'email par défaut contient déjà `{{ .Token }}` pour les
nouveaux projets. Si le mail reçu ne contient qu'un lien, éditer
_Authentication_ → _Emails_ → _Magic Link_ et y insérer `{{ .Token }}`.

---

## PWA / iOS

- Icônes : `public/icons/icon.svg` (tuile « any ») et `icon-maskable.svg` (marge de
  sécurité pour Android, qui rogne l'icône selon la forme du lanceur). Les PNG en sont
  dérivés — pour les régénérer après une retouche du tracé :

  ```bash
  python scripts/generate_icons.py
  ```

  Le script pilote Chrome en headless, sans dépendance ajoutée au projet. Ne pas capturer
  le SVG directement : Chrome le rendrait à sa taille intrinsèque et recadrerait le coin
  haut-gauche au lieu de le réduire. Le script contourne ce piège, c'est toute sa raison
  d'être.

- `public/manifest.webmanifest` + `public/sw.js` (service worker minimal : coquille en
  cache, requêtes Supabase toujours réseau). Le SW n'est enregistré qu'en production.
- Meta tags Apple dans `index.html` : `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` en 180×180.
- `viewport-fit=cover` + classes `.safe-top` / `.safe-bottom` / `.safe-x` basées sur
  `env(safe-area-inset-*)` pour l'encoche et la barre du bas.
- Les inputs sont en 16px : en dessous, iOS zoome automatiquement au focus.
- Une bannière d'aide à l'installation s'affiche **uniquement sur Safari iOS non installé**
  (`src/components/IosInstallBanner.tsx`), et se masque définitivement une fois fermée.

**Installer sur iPhone** : ouvrir le site dans Safari → bouton _Partager_ →
_Sur l'écran d'accueil_.

---

## Déploiement

L'app est un site statique : n'importe quel hébergeur front fait l'affaire. Le plus simple,
en connectant le repo GitHub :

**Vercel** — _New Project_ → importer le repo. Framework détecté : Vite
(build `npm run build`, output `dist`). Ajouter `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY` dans _Settings_ → _Environment Variables_, puis redéployer.

**Netlify** — _Add new site_ → _Import an existing project_. Build command `npm run build`,
publish directory `dist`. Mêmes variables dans _Site settings_ → _Environment variables_.

Les variables `VITE_*` sont injectées **au build** : après les avoir ajoutées ou modifiées,
il faut relancer un déploiement.

Une fois en ligne, ajouter l'URL de prod dans Supabase : _Authentication_ → _URL
Configuration_ → _Site URL_.

---

## Structure

```
src/
  components/    écrans et UI (Auth, TodayScreen, WeightScreen, Ring, …)
  hooks/         accès aux données (useSession, useTargets, useFoodEntries, useWeights,
                 useFavorites, useRecents, useHistory, useWater)
  lib/           client Supabase, types, helpers de date, presets, Open Food Facts,
                 répartition des macros
public/          manifest, service worker (cache + Web Push), icônes
supabase/
  migrations/    SQL à coller dans le SQL Editor
  functions/     Edge Functions Deno (send-reminders : notifications planifiées)
```

## Notifications planifiées

iOS n'autorise pas une PWA à programmer une notification locale : sans serveur,
rien n'arrive quand l'app est fermée. Les rappels passent donc par le **Web Push**,
avec une Edge Function déclenchée chaque minute par `pg_cron` qui compare l'heure de
Paris au planning.

Deux conditions côté iPhone : **iOS 16.4+**, et la PWA **installée sur l'écran
d'accueil** — en onglet Safari l'abonnement n'existe pas, et les réglages le disent
au lieu de laisser un interrupteur qui ne répond pas.

Mise en service détaillée (clés VAPID, secrets, cron) :
[`supabase/functions/send-reminders/README.md`](supabase/functions/send-reminders/README.md).

## Open Food Facts

La recherche d'aliments interroge [Open Food Facts](https://fr.openfoodfacts.org), base
collaborative et gratuite, directement depuis le navigateur (`src/lib/openfoodfacts.ts`) —
aucune clé, aucun proxy, rien à configurer.

Deux limites à connaître : les produits sans calories renseignées sont filtrés, et les
produits frais non emballés (viande au détail, légumes en vrac) y sont mal couverts. Pour
ceux-là, la saisie manuelle reste le bon outil — et une fois saisis, ils remontent dans
l'onglet Récents.

Trois détails qui conditionnent la qualité des résultats :

- Le paramètre `q` de l'API est interprété comme une **requête Lucene**. La saisie est donc
  débarrassée des opérateurs (`-`, `(`, `!`, `:`…) avant l'appel : sans ça le tiret de
  « saint-nectaire » vaut un NOT, et une parenthèse seule fait répondre 400.
- `langs=fr,en` est transmis explicitement — sans lui l'API ne cherche que dans les
  sous-champs anglais.
- La casse et les élisions sont déjà gérées par l'analyseur français d'Elasticsearch, des
  deux côtés. Les accents, eux, ne sont pas repliés : la requête part donc sous ses deux
  formes (`(crème) OR (creme)`) quand elles diffèrent, ce qui rattrape « pôulet » sans
  casser « crème », qui est indexé accentué.

L'ancienne API (`cgi/search.pl`) sert de repli, aussi bien sur panne que sur réponse vide.
Une erreur n'est affichée que si les deux endpoints ont échoué **et** qu'aucun résultat
n'a été obtenu.

Les dates sont manipulées en jour local (`YYYY-MM-DD`, voir `src/lib/date.ts`) et jamais en
UTC : sinon une saisie tardive le soir bascule sur le lendemain.
