-- Goatly — profil utilisateur et objectifs calculés
-- À coller dans l'éditeur SQL de Supabase, après 0005_push_subscriptions.sql.

-- Les objectifs nutritionnels étaient les mêmes pour tout le monde. Le profil
-- permet de les estimer (Mifflin-St Jeor + facteur d'activité) à la création
-- du compte. Le calcul propose, il n'impose pas : les `targets` restent
-- éditables à la main ensuite.

create table if not exists public.profile (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  sex text not null check (sex in ('homme','femme')),
  age int not null check (age between 14 and 100),
  height_cm int not null check (height_cm between 120 and 230),
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 250),
  activity text not null check (activity in ('sedentaire','leger','modere','actif','tres_actif')),
  goal text not null check (goal in ('perte','maintien','muscle','recomp')),
  -- Les comptes créés avant cette migration n'ont pas de ligne : l'app le lit
  -- comme « onboarding à faire », et le propose à la prochaine connexion.
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile enable row level security;

create policy "profile_select_own"
  on public.profile for select
  using (user_id = auth.uid());

create policy "profile_insert_own"
  on public.profile for insert
  with check (user_id = auth.uid());

create policy "profile_update_own"
  on public.profile for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "profile_delete_own"
  on public.profile for delete
  using (user_id = auth.uid());
