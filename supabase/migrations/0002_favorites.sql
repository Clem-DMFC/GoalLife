-- Goatly — favoris et plats composés
-- À coller dans l'éditeur SQL de Supabase, après 0001_init.sql.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  kcal int not null default 0,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0,
  -- Ingrédients d'un plat composé : [{ name, grams, kcal, protein, carbs, fat }]
  -- Vide pour un aliment simple.
  items jsonb,
  created_at timestamptz default now()
);

create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own" on public.favorites
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete using (user_id = auth.uid());
