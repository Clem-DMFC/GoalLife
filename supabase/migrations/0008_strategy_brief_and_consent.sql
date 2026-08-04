-- Goatly — brief de coach IA et consentement RGPD
-- À coller dans l'éditeur SQL de Supabase, après 0007_profile_identity.sql.

-- Le brief interprète les chiffres déjà calculés par la formule (voir
-- src/lib/nutrition.ts) : il ne les recalcule jamais. Stocké pour être
-- réaffiché sans regénérer à chaque ouverture des réglages.
alter table public.profile
  add column if not exists strategy_brief text,
  add column if not exists strategy_brief_generated_at timestamptz;

-- Horodatage du consentement au traitement des données (case à cocher à
-- l'inscription, voir src/components/Auth.tsx). Nullable : les comptes créés
-- avant cette colonne n'ont pas ce consentement enregistré rétroactivement —
-- rien ne les bloque, mais rien ne prétend non plus qu'ils l'ont donné.
alter table public.profile
  add column if not exists consent_at timestamptz;

-- ---------------------------------------------------------------------------
-- Suppression de compte (RGPD) — vérification, aucune migration nécessaire
-- ---------------------------------------------------------------------------
--
-- Chaque table qui porte des données personnelles référence déjà
-- `auth.users(id) on delete cascade` : targets, food_entries, weights,
-- favorites, water, push_subscriptions, profile. Supprimer la ligne
-- `auth.users` (via l'API admin, dans l'Edge Function `delete-account`)
-- suffit donc à effacer toutes ces lignes sans suppression manuelle table
-- par table.
--
-- Deux angles morts, volontairement PAS couverts par cascade Postgres, à
-- traiter dans `delete-account` :
--   1. Les photos de profil (Supabase Storage, bucket `avatars`) : un objet
--      Storage n'est pas une ligne Postgres, aucune cascade ne le touche.
--   2. `reminder_log` n'a pas de `user_id` — c'est un journal global
--      d'idempotence pour les rappels planifiés, pas une donnée personnelle.
--      Rien à supprimer ni à exporter pour un utilisateur en particulier.
