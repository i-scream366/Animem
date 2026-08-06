-- ============================================================
-- ANIMEM — Supabase SQL Schema
-- Einfach im Supabase Dashboard -> SQL Editor komplett einfügen
-- und ausführen. Läuft ohne Prisma / ohne native Binaries,
-- deshalb geeignet für StackBlitz/Codespaces vom Handy aus.
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('OWNER', 'HEAD_ADMIN', 'ADMIN', 'USER');
create type content_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type rating_target as enum ('SERIES', 'MOVIE', 'EPISODE');
create type watch_target as enum ('EPISODE', 'MOVIE');
create type ticket_status as enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
create type ticket_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- ------------------------------------------------------------
-- PROFILES (1:1 zu auth.users, enthält Rolle)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  role user_role not null default 'USER',
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger: legt bei jeder neuen Registrierung automatisch ein Profil an
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Helfer-Funktionen für RLS
create function current_role_rank() returns int as $$
  select case (select role from profiles where id = auth.uid())
    when 'OWNER' then 3
    when 'HEAD_ADMIN' then 2
    when 'ADMIN' then 1
    else 0
  end;
$$ language sql stable security definer;

create function is_staff() returns boolean as $$
  select current_role_rank() >= 1;
$$ language sql stable;

-- ------------------------------------------------------------
-- TAXONOMIE
-- ------------------------------------------------------------
create table genres (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

-- ------------------------------------------------------------
-- SERIES / SEASON / EPISODE
-- ------------------------------------------------------------
create table series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  thumbnail_url text not null,
  banner_url text,
  release_date date,
  status content_status not null default 'DRAFT',
  avg_rating numeric(3,1) not null default 0,
  ratings_count int not null default 0,
  view_count int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references series(id) on delete cascade,
  number int not null,
  title text,
  created_at timestamptz not null default now(),
  unique (series_id, number)
);

create table episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  number int not null,
  title text not null,
  description text,
  thumbnail_url text,
  embed_url text not null,
  embed_provider text,
  duration_sec int,
  release_date date,
  status content_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  unique (season_id, number)
);

create table series_genres (
  series_id uuid references series(id) on delete cascade,
  genre_id uuid references genres(id) on delete cascade,
  primary key (series_id, genre_id)
);

create table series_tags (
  series_id uuid references series(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (series_id, tag_id)
);

-- ------------------------------------------------------------
-- MOVIES
-- ------------------------------------------------------------
create table movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  thumbnail_url text not null,
  banner_url text,
  embed_url text not null,
  embed_provider text,
  duration_sec int,
  release_date date,
  status content_status not null default 'DRAFT',
  avg_rating numeric(3,1) not null default 0,
  ratings_count int not null default 0,
  view_count int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table movie_genres (
  movie_id uuid references movies(id) on delete cascade,
  genre_id uuid references genres(id) on delete cascade,
  primary key (movie_id, genre_id)
);

create table movie_tags (
  movie_id uuid references movies(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (movie_id, tag_id)
);

-- ------------------------------------------------------------
-- RATINGS (mit Auto-Aggregation per Trigger)
-- ------------------------------------------------------------
create table ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  target_type rating_target not null,
  value int not null check (value between 1 and 10),
  series_id uuid references series(id) on delete cascade,
  movie_id uuid references movies(id) on delete cascade,
  episode_id uuid references episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, series_id, movie_id, episode_id)
);

create function recompute_rating() returns trigger as $$
declare
  target_table text;
  target_id uuid;
begin
  target_id := coalesce(new.series_id, old.series_id, new.movie_id, old.movie_id);
  if (coalesce(new.series_id, old.series_id)) is not null then
    update series set
      avg_rating = coalesce((select round(avg(value)::numeric, 1) from ratings where series_id = target_id), 0),
      ratings_count = (select count(*) from ratings where series_id = target_id)
    where id = target_id;
  elsif (coalesce(new.movie_id, old.movie_id)) is not null then
    update movies set
      avg_rating = coalesce((select round(avg(value)::numeric, 1) from ratings where movie_id = target_id), 0),
      ratings_count = (select count(*) from ratings where movie_id = target_id)
    where id = target_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_rating_change
  after insert or update or delete on ratings
  for each row execute procedure recompute_rating();

-- ------------------------------------------------------------
-- VERLAUF / WATCHLIST / ABOS / BENACHRICHTIGUNGEN
-- ------------------------------------------------------------
create table watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  target_type watch_target not null,
  episode_id uuid references episodes(id) on delete cascade,
  movie_id uuid references movies(id) on delete cascade,
  progress_sec int not null default 0,
  watched_at timestamptz not null default now()
);

create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  series_id uuid references series(id) on delete cascade,
  movie_id uuid references movies(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, series_id, movie_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  series_id uuid not null references series(id) on delete cascade,
  notify_on_new_episode boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, series_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger: benachrichtigt alle Abonnenten, wenn eine neue Episode veröffentlicht wird
create function notify_subscribers() returns trigger as $$
begin
  if new.status = 'PUBLISHED' then
    insert into notifications (user_id, type, message, link)
    select s.user_id, 'NEW_EPISODE',
           'Neue Episode verfügbar: ' || new.title,
           '/series'
    from subscriptions s
    join seasons se on se.id = new.season_id
    where s.series_id = se.series_id and s.notify_on_new_episode = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_episode_published
  after insert on episodes
  for each row execute procedure notify_subscribers();

-- ------------------------------------------------------------
-- SAMMLUNGEN
-- ------------------------------------------------------------
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  series_id uuid references series(id) on delete cascade,
  movie_id uuid references movies(id) on delete cascade,
  episode_id uuid references episodes(id) on delete cascade,
  "order" int not null default 0
);

-- ------------------------------------------------------------
-- FORUM
-- ------------------------------------------------------------
create table forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  "order" int not null default 0
);

create table forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references forum_categories(id) on delete cascade,
  user_id uuid not null references profiles(id),
  title text not null,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references forum_threads(id) on delete cascade,
  user_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

-- ------------------------------------------------------------
-- SUPPORT / TICKETS
-- ------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  status ticket_status not null default 'OPEN',
  priority ticket_priority not null default 'MEDIUM',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table series enable row level security;
alter table seasons enable row level security;
alter table episodes enable row level security;
alter table movies enable row level security;
alter table genres enable row level security;
alter table tags enable row level security;
alter table series_genres enable row level security;
alter table series_tags enable row level security;
alter table movie_genres enable row level security;
alter table movie_tags enable row level security;
alter table ratings enable row level security;
alter table watch_history enable row level security;
alter table watchlist_items enable row level security;
alter table subscriptions enable row level security;
alter table notifications enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table forum_categories enable row level security;
alter table forum_threads enable row level security;
alter table forum_posts enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;

-- Profiles: öffentlich lesbar, nur eigenes Profil editierbar
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Content: öffentlich lesbar wenn veröffentlicht, Staff sieht alles, Staff darf schreiben
create policy "series_select" on series for select using (status = 'PUBLISHED' or is_staff());
create policy "series_write" on series for all using (is_staff()) with check (is_staff());

create policy "seasons_select" on seasons for select using (true);
create policy "seasons_write" on seasons for all using (is_staff()) with check (is_staff());

create policy "episodes_select" on episodes for select using (status = 'PUBLISHED' or is_staff());
create policy "episodes_write" on episodes for all using (is_staff()) with check (is_staff());

create policy "movies_select" on movies for select using (status = 'PUBLISHED' or is_staff());
create policy "movies_write" on movies for all using (is_staff()) with check (is_staff());

create policy "genres_select" on genres for select using (true);
create policy "genres_write" on genres for all using (is_staff()) with check (is_staff());
create policy "tags_select" on tags for select using (true);
create policy "tags_write" on tags for all using (is_staff()) with check (is_staff());

create policy "series_genres_select" on series_genres for select using (true);
create policy "series_genres_write" on series_genres for all using (is_staff()) with check (is_staff());
create policy "series_tags_select" on series_tags for select using (true);
create policy "series_tags_write" on series_tags for all using (is_staff()) with check (is_staff());
create policy "movie_genres_select" on movie_genres for select using (true);
create policy "movie_genres_write" on movie_genres for all using (is_staff()) with check (is_staff());
create policy "movie_tags_select" on movie_tags for select using (true);
create policy "movie_tags_write" on movie_tags for all using (is_staff()) with check (is_staff());

-- Ratings: jeder darf lesen, nur eigene Bewertung anlegen/ändern/löschen
create policy "ratings_select" on ratings for select using (true);
create policy "ratings_insert_own" on ratings for insert with check (auth.uid() = user_id);
create policy "ratings_update_own" on ratings for update using (auth.uid() = user_id);
create policy "ratings_delete_own" on ratings for delete using (auth.uid() = user_id);

-- Persönliche Daten: nur eigener Zugriff
create policy "watch_history_own" on watch_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watchlist_own" on watchlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_own" on subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_own" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sammlungen: eigene immer, fremde nur wenn öffentlich
create policy "collections_select" on collections for select using (is_public or auth.uid() = user_id);
create policy "collections_write_own" on collections for insert with check (auth.uid() = user_id);
create policy "collections_update_own" on collections for update using (auth.uid() = user_id);
create policy "collections_delete_own" on collections for delete using (auth.uid() = user_id);
create policy "collection_items_select" on collection_items for select using (
  exists (select 1 from collections c where c.id = collection_id and (c.is_public or c.user_id = auth.uid()))
);
create policy "collection_items_write" on collection_items for all using (
  exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
);

-- Forum: öffentlich lesbar, angemeldete Nutzer posten, Staff moderiert alles
create policy "forum_categories_select" on forum_categories for select using (true);
create policy "forum_categories_write" on forum_categories for all using (is_staff()) with check (is_staff());
create policy "forum_threads_select" on forum_threads for select using (true);
create policy "forum_threads_insert" on forum_threads for insert with check (auth.uid() = user_id);
create policy "forum_threads_modify" on forum_threads for update using (auth.uid() = user_id or is_staff());
create policy "forum_threads_delete" on forum_threads for delete using (auth.uid() = user_id or is_staff());
create policy "forum_posts_select" on forum_posts for select using (true);
create policy "forum_posts_insert" on forum_posts for insert with check (auth.uid() = user_id);
create policy "forum_posts_modify" on forum_posts for update using (auth.uid() = user_id or is_staff());
create policy "forum_posts_delete" on forum_posts for delete using (auth.uid() = user_id or is_staff());

-- Tickets: eigene Tickets + Staff sieht alle
create policy "tickets_select" on tickets for select using (auth.uid() = user_id or is_staff());
create policy "tickets_insert" on tickets for insert with check (auth.uid() = user_id);
create policy "tickets_update" on tickets for update using (auth.uid() = user_id or is_staff());
create policy "ticket_messages_select" on ticket_messages for select using (
  exists (select 1 from tickets t where t.id = ticket_id and (t.user_id = auth.uid() or is_staff()))
);
create policy "ticket_messages_insert" on ticket_messages for insert with check (
  exists (select 1 from tickets t where t.id = ticket_id and (t.user_id = auth.uid() or is_staff()))
);

-- ------------------------------------------------------------
-- Seed: Grundkategorien fürs Forum (optional)
-- ------------------------------------------------------------
insert into forum_categories (name, slug, description, "order") values
  ('Ankündigungen', 'ankuendigungen', 'News rund um Animem', 0),
  ('Serien-Diskussion', 'serien-diskussion', 'Sprich über deine Lieblingsserien', 1),
  ('Support & Feedback', 'support-feedback', 'Fragen, Wünsche, Bugs', 2);
