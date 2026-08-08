import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import SubscribeButton from "@/components/series/SubscribeButton";
import RatingWidget from "@/components/series/RatingWidget";

export default async function SeriesDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: series } = await supabase
    .from("series")
    .select(
      "id, title, description, thumbnail_url, banner_url, avg_rating, ratings_count, seasons(id, number, title, episodes(id, number, title, thumbnail_url, status)), tags:series_tags(tag:tags(name, slug))"
    )
    .eq("slug", params.slug)
    .single();

  if (!series) notFound();

  let myRating: number | null = null;
  let isSubscribed = false;

  if (user) {
    const { data: rating } = await supabase
      .from("ratings")
      .select("value")
      .eq("user_id", user.id)
      .eq("series_id", series.id)
      .eq("target_type", "SERIES")
      .maybeSingle();
    myRating = rating?.value ?? null;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("series_id", series.id)
      .maybeSingle();
    isSubscribed = Boolean(sub);
  }

  const seasons = (series.seasons ?? []).sort((a: any, b: any) => a.number - b.number);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {series.banner_url && (
        <div className="relative h-56 w-full md:h-72">
          <Image src={series.banner_url} alt={series.title} fill className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
        </div>
      )}

      <div className="mx-auto -mt-16 max-w-5xl px-4 pb-12">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="relative h-56 w-40 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
            <Image src={series.thumbnail_url} alt={series.title} fill className="object-cover" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold md:text-3xl">{series.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-300">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {Number(series.avg_rating).toFixed(1)} · {series.ratings_count} Bewertungen
            </div>
            <p className="mt-4 max-w-2xl text-sm text-neutral-300">{series.description}</p>

            {!!(series as any).tags?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(series as any).tags.map((t: any) => (
                  <Link
                    key={t.tag.slug}
                    href={`/tags/${t.tag.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 hover:bg-white/10"
                  >
                    #{t.tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <SubscribeButton seriesId={series.id} initiallySubscribed={isSubscribed} />
                  <RatingWidget targetType="SERIES" seriesId={series.id} initialValue={myRating} />
                </>
              ) : (
                <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300">
                  Anmelden, um zu bewerten oder zu abonnieren
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {seasons.map((season: any) => (
            <div key={season.id}>
              <h2 className="mb-3 text-lg font-semibold">
                Staffel {season.number}
                {season.title ? ` — ${season.title}` : ""}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {season.episodes
                  .filter((ep: any) => ep.status === "PUBLISHED")
                  .sort((a: any, b: any) => a.number - b.number)
                  .map((ep: any) => (
                    <Link
                      key={ep.id}
                      href={`/series/${params.slug}/s/${season.number}/e/${ep.number}`}
                      className="group"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-800">
                        <Image
                          src={series.thumbnail_url}
                          alt={ep.title}
                          fill
                          className="object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-lg font-bold text-white">E{ep.number}</span>
                        </div>
                      </div>
                      <p className="mt-1 truncate text-xs text-neutral-300">
                        {ep.number}. {ep.title}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
