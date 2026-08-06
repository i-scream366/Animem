import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import EmbedPlayer from "@/components/player/EmbedPlayer";
import RatingWidget from "@/components/series/RatingWidget";

export default async function MovieDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: movie } = await supabase
    .from("movies")
    .select("id, title, description, embed_url, avg_rating, ratings_count")
    .eq("slug", params.slug)
    .eq("status", "PUBLISHED")
    .single();

  if (!movie) notFound();

  let myRating: number | null = null;
  if (user) {
    const { data: rating } = await supabase
      .from("ratings")
      .select("value")
      .eq("user_id", user.id)
      .eq("movie_id", movie.id)
      .eq("target_type", "MOVIE")
      .maybeSingle();
    myRating = rating?.value ?? null;

    await supabase.from("watch_history").upsert(
      { user_id: user.id, target_type: "MOVIE", movie_id: movie.id, watched_at: new Date().toISOString() },
      { onConflict: "user_id,movie_id" }
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-bold">{movie.title}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          ⭐ {Number(movie.avg_rating).toFixed(1)} · {movie.ratings_count} Bewertungen
        </p>

        <div className="mt-4">
          <EmbedPlayer embedUrl={movie.embed_url} title={movie.title} />
        </div>

        <div className="mt-4">
          {user ? (
            <RatingWidget targetType="MOVIE" movieId={movie.id} initialValue={myRating} />
          ) : null}
        </div>

        {movie.description && <p className="mt-4 text-sm text-neutral-300">{movie.description}</p>}
      </div>
    </div>
  );
}
