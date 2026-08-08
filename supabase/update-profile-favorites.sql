-- ============================================================
-- ANIMEM — Zusatz-Migration: Profil-Sieger-Treppchen
-- Im Supabase SQL Editor einmalig ausführen (Teil 4)
-- ============================================================

create table profile_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  rank int not null check (rank between 1 and 3),
  series_id uuid references series(id) on delete cascade,
  movie_id uuid references movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, rank)
);

alter table profile_favorites enable row level security;

-- Öffentlich sichtbar (später für Profil-Ansicht anderer Nutzer), nur eigene Einträge änderbar
create policy "profile_favorites_select" on profile_favorites for select using (true);
create policy "profile_favorites_write_own" on profile_favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
