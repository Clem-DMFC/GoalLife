-- Goatly — abonnements Web Push et journal des rappels
-- À coller dans l'éditeur SQL de Supabase, après 0004_water_increment.sql.

-- iOS n'autorise pas la planification locale de notifications dans une PWA
-- (pas de Notification Triggers). La seule voie fiable est le Web Push : le
-- navigateur s'abonne, on garde l'abonnement ici, et une Edge Function
-- planifiée envoie les rappels aux heures voulues.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  -- L'URL du service de push (APNs pour iOS) identifie l'abonnement de façon
  -- unique : réinstaller la PWA en crée un nouveau, il ne doit pas doublonner.
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Chacun ne voit et ne gère que ses propres abonnements.
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- L'Edge Function lit la table avec la clé service-role, qui contourne la RLS
-- par conception : elle doit joindre tous les abonnés, pas un seul.

-- ---------------------------------------------------------------------------

-- Journal des envois : une ligne par rappel effectivement parti.
--
-- Le cron tourne chaque minute et compare l'heure de Paris au planning. Sans
-- garde, une exécution rejouée (relance manuelle, deux workers qui se
-- chevauchent, appel HTTP réémis) renverrait le même rappel une seconde fois —
-- une notification en double à 7 h du matin se remarque.
--
-- La clé primaire (jour, créneau) rend l'envoi idempotent : l'insertion échoue
-- silencieusement au deuxième passage, et la fonction saute l'envoi.
create table if not exists public.reminder_log (
  day date not null,
  slot text not null,
  sent_at timestamptz not null default now(),
  primary key (day, slot)
);

alter table public.reminder_log enable row level security;
-- Aucune policy : seule la clé service-role y touche, jamais le navigateur.

-- Purge des vieilles lignes, pour que le journal ne grossisse pas sans fin.
create or replace function public.prune_reminder_log()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.reminder_log where day < current_date - 7;
$$;
