-- GoalLife — repas et suivi de l'eau
-- À coller dans l'éditeur SQL de Supabase, après 0002_favorites.sql.

-- ---------------------------------------------------------------------------
-- 1. Repas : on tague chaque entrée existante, pas de table dédiée.
-- ---------------------------------------------------------------------------

-- Nullable à dessein : les entrées déjà en base restent null et s'affichent
-- dans le groupe « Autre ».
alter table public.food_entries
  add column if not exists meal_type text
  check (meal_type in ('petit_dej', 'dejeuner', 'diner', 'collation'));

-- ---------------------------------------------------------------------------
-- 2. Eau : un total par (user, jour), incrémenté par upsert.
-- ---------------------------------------------------------------------------

create table if not exists public.water (
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  day date not null default current_date,
  ml int not null default 0,
  primary key (user_id, day)
);

alter table public.targets
  add column if not exists water_ml int not null default 3000;

alter table public.water enable row level security;

drop policy if exists "water_select_own" on public.water;
create policy "water_select_own" on public.water
  for select using (user_id = auth.uid());

drop policy if exists "water_insert_own" on public.water;
create policy "water_insert_own" on public.water
  for insert with check (user_id = auth.uid());

drop policy if exists "water_update_own" on public.water;
create policy "water_update_own" on public.water
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "water_delete_own" on public.water;
create policy "water_delete_own" on public.water
  for delete using (user_id = auth.uid());
