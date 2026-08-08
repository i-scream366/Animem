-- ============================================================
-- ANIMEM — Zusatz-Migration: Storage für echte Bild-Uploads
-- (Serien-/Film-Thumbnails, Banner, Profilbilder)
-- Im Supabase SQL Editor einmalig ausführen (Teil 5)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Thumbnails/Banner: öffentlich lesbar, nur Staff darf hochladen/ändern/löschen
create policy "thumbnails_public_read" on storage.objects
  for select using (bucket_id = 'thumbnails');

create policy "thumbnails_staff_insert" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and is_staff());

create policy "thumbnails_staff_update" on storage.objects
  for update using (bucket_id = 'thumbnails' and is_staff());

create policy "thumbnails_staff_delete" on storage.objects
  for delete using (bucket_id = 'thumbnails' and is_staff());

-- Avatare: öffentlich lesbar, jeder Nutzer darf nur in seinem eigenen Unterordner (user_id/...) hochladen
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_own_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_own_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_own_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
