-- Goatly — prénom et photo de profil
-- À coller dans l'éditeur SQL de Supabase, après 0006_profile.sql.

-- Deux colonnes nullables : les comptes déjà créés n'ont ni l'un ni l'autre,
-- et l'app doit continuer à tourner sans. Le prénom sert à l'accueil, la
-- photo à l'écran Réglages.
alter table public.profile
  add column if not exists first_name text check (char_length(first_name) between 1 and 40),
  add column if not exists avatar_url text;

-- ---------------------------------------------------------------------------
-- Stockage des photos de profil
-- ---------------------------------------------------------------------------

-- Bucket public en lecture : l'URL d'un avatar est alors utilisable telle
-- quelle dans un <img>, sans signature à renouveler. Le chemin contient un
-- UUID non devinable, mais ce n'est pas un secret — ne pas y déposer autre
-- chose qu'une photo qu'on accepterait de voir circuler.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- L'écriture, elle, est bien restreinte : chacun ne peut déposer que dans le
-- dossier qui porte son propre identifiant. `storage.foldername(name)[1]` est
-- le premier segment du chemin, soit `<user_id>/avatar.jpg`.
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
