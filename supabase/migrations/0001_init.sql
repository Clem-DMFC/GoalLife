-- Goatly — schéma initial
-- À coller tel quel dans l'éditeur SQL de Supabase (SQL Editor > New query > Run).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Objectifs (une seule ligne par user)
create table if not exists public.targets (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  kcal int not null default 2800,
  protein int not null default 140,
  carbs int not null default 390,
  fat int not null default 78,
  updated_at timestamptz default now()
);

-- Entrées alimentaires
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  day date not null default current_date,
  name text not null,
  kcal int not null default 0,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0,
  created_at timestamptz default now()
);

-- Pesées
create table if not exists public.weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  day date not null,
  kg numeric(5,1) not null,
  unique (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Index (les requêtes filtrent toujours par user + jour)
-- ---------------------------------------------------------------------------

create index if not exists food_entries_user_day_idx on public.food_entries (user_id, day);
create index if not exists weights_user_day_idx on public.weights (user_id, day desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.targets enable row level security;
alter table public.food_entries enable row level security;
alter table public.weights enable row level security;

-- targets
drop policy if exists "targets_select_own" on public.targets;
create policy "targets_select_own" on public.targets
  for select using (user_id = auth.uid());

drop policy if exists "targets_insert_own" on public.targets;
create policy "targets_insert_own" on public.targets
  for insert with check (user_id = auth.uid());

drop policy if exists "targets_update_own" on public.targets;
create policy "targets_update_own" on public.targets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "targets_delete_own" on public.targets;
create policy "targets_delete_own" on public.targets
  for delete using (user_id = auth.uid());

-- food_entries
drop policy if exists "food_entries_select_own" on public.food_entries;
create policy "food_entries_select_own" on public.food_entries
  for select using (user_id = auth.uid());

drop policy if exists "food_entries_insert_own" on public.food_entries;
create policy "food_entries_insert_own" on public.food_entries
  for insert with check (user_id = auth.uid());

drop policy if exists "food_entries_update_own" on public.food_entries;
create policy "food_entries_update_own" on public.food_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "food_entries_delete_own" on public.food_entries;
create policy "food_entries_delete_own" on public.food_entries
  for delete using (user_id = auth.uid());

-- weights
drop policy if exists "weights_select_own" on public.weights;
create policy "weights_select_own" on public.weights
  for select using (user_id = auth.uid());

drop policy if exists "weights_insert_own" on public.weights;
create policy "weights_insert_own" on public.weights
  for insert with check (user_id = auth.uid());

drop policy if exists "weights_update_own" on public.weights;
create policy "weights_update_own" on public.weights
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "weights_delete_own" on public.weights;
create policy "weights_delete_own" on public.weights
  for delete using (user_id = auth.uid());
