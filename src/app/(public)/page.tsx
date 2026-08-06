import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopThreePodium from "@/components/podium/TopThreePodium";

export default async function HomePage() {
  const supabase = createClient();

  const { data: topSeries } = await supabase
    .from("series")
    .select("id, slug, title, thumbnail_url, avg_rating")
    .eq("status", "PUBLISHED")
    .order("avg_rating", { ascending: false })
    .limit(3);

  const { data: latest } = await supabase
    .from("series")
    .select("id, slug, title, thumbnail_url, avg_rating")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(12);

  const podiumData = (topSeries ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    thumbnailUrl: s.thumbnail_url,
    avgRating: Number(s.avg_rating),
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {podiumData.length === 3 && (
        <TopThreePodium first={podiumData[0]} second={podiumData[1]} third={podiumData[2]} />
      )}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-bold">Neu hinzugefügt</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(latest ?? []).map((s) => (
            <Link key={s.id} href={`/series/${s.slug}`} className="group">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
                <Image
                  src={s.thumbnail_url}
                  alt={s.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="200px"
                />
              </div>
              <p className="mt-2 truncate text-sm text-neutral-200">{s.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
