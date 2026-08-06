import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import EmbedPlayer from "@/components/player/EmbedPlayer";
import RatingWidget from "@/components/series/RatingWidget";

interface Params {
  params: { slug: string; season: string; episode: string };
}

export default async function EpisodePage({ params }: Params) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: series } = await supabase
    .from("series")
    .select("id, title, slug, seasons(id, number, episodes(id, number, title, description, embed_url, status))")
    .eq("slug", params.slug)
    .single();

  if (!series) notFound();

  const season = (series.seasons ?? []).find((s: any) => s.number === Number(params.season));
  const episode = season?.episodes.find((e: any) => e.number === Number(params.episode));

  if (!episode || episode.status !== "PUBLISHED") notFound();

  let myRating: number | null = null;
  if (user) {
    const { data: rating } = await supabase
      .from("ratings")
      .select("value")
      .eq("user_id", user.id)
      .eq("episode_id", episode.id)
      .eq("target_type", "EPISODE")
      .maybeSingle();
    myRating = rating?.value ?? null;

    // Verlauf protokollieren (einfacher Upsert ohne Fortschritts-Tracking im Player selbst)
    await supabase.from("watch_history").upsert(
      {
        user_id: user.id,
        target_type: "EPISODE",
        episode_id: episode.id,
        watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,episode_id" }
    );
  }

  const nextEpisode = season?.episodes.find((e: any) => e.number === episode.number + 1);

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href={`/series/${params.slug}`} className="text-sm text-neutral-400 hover:text-white">
          ← {series.title}
        </Link>

        <h1 className="mt-2 text-xl font-bold">
          S{season?.number} · E{episode.number} — {episode.title}
        </h1>

        <div className="mt-4">
          <EmbedPlayer embedUrl={episode.embed_url} title={episode.title} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          {user ? (
            <RatingWidget targetType="EPISODE" episodeId={episode.id} initialValue={myRating} />
          ) : (
            <span />
          )}

          {nextEpisode && (
            <Link
              href={`/series/${params.slug}/s/${season?.number}/e/${nextEpisode.number}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
            >
              Nächste Episode →
            </Link>
          )}
        </div>

        {episode.description && (
          <p className="mt-4 text-sm text-neutral-300">{episode.description}</p>
        )}
      </div>
    </div>
  );
}
