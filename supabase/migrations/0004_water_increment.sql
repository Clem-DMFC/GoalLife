-- Goatly — incrément d'eau atomique
-- À coller dans l'éditeur SQL de Supabase, après 0003_meals_water.sql.

-- Le total d'eau était calculé côté client (lire `ml`, ajouter, réécrire) :
-- deux ajouts rapprochés — double tap, ou retry réseau sur mobile — pouvaient
-- s'écraser. L'addition se fait désormais dans Postgres, en une instruction.
--
-- `security invoker` (défaut) : la RLS de `water` s'applique normalement, la
-- fonction n'ouvre aucune porte dérobée. `delta` peut être négatif — c'est le
-- bouton « annuler le dernier ajout » — d'où le plancher à 0.
create or replace function public.add_water(delta int, target_day date default current_date)
returns int
language sql
set search_path = public
as $$
  insert into public.water (user_id, day, ml)
  values (auth.uid(), target_day, greatest(0, delta))
  on conflict (user_id, day)
  do update set ml = greatest(0, water.ml + delta)
  returning ml;
$$;

grant execute on function public.add_water(int, date) to authenticated;
