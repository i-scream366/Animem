import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import ProfileHeader from "@/components/profile/ProfileHeader";
import FavoritesPicker from "@/components/profile/FavoritesPicker";
import ProfileLists from "@/components/profile/ProfileLists";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createClient();

  const [{ data: profile }, { data: favorites }, { data: allSeries }, { data: allMovies }, { data: watchlist }, { data: subscriptions }, { data: collections }] =
    await Promise.all([
      supabase.from("profiles").select("username, avatar_url, bio, role").eq("id", user.id).single(),
      supabase
        .from("profile_favorites")
        .select("rank, series:series_id(id, slug, title, thumbnail_url), movie:movie_id(id, slug, title, thumbnail_url)")
        .eq("user_id", user.id)
        .order("rank"),
      supabase.from("series").select("id, title").eq("status", "PUBLISHED").order("title"),
      supabase.from("movies").select("id, title").eq("status", "PUBLISHED").order("title"),
      supabase
        .from("watchlist_items")
        .select("id, series:series_id(slug, title, thumbnail_url), movie:movie_id(slug, title, thumbnail_url)")
        .eq("user_id", user.id),
      supabase
        .from("subscriptions")
        .select("id, series:series_id(slug, title, thumbnail_url)")
        .eq("user_id", user.id),
      supabase.from("collections").select("id, title, description").eq("user_id", user.id),
    ]);

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <ProfileHeader
          userId={user.id}
          username={profile?.username ?? user.username}
          role={profile?.role ?? user.role}
          avatarUrl={profile?.avatar_url ?? null}
          bio={profile?.bio ?? null}
        />

        <FavoritesPicker
          favorites={(favorites as any) ?? []}
          allSeries={allSeries ?? []}
          allMovies={allMovies ?? []}
        />

        <ProfileLists
          watchlist={(watchlist as any) ?? []}
          subscriptions={(subscriptions as any) ?? []}
          collections={collections ?? []}
        />
      </div>
    </div>
  );
}
