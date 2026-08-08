import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SeriesListPage() {
  const supabase = createClient();

  const { data: series } = await supabase
    .from("series")
    .select("id, slug, title, thumbnail_url, avg_rating")
    .eq("status", "PUBLISHED")
    .order("title", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">Serien</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(series ?? []).map((s) => (
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
              <p className="text-xs text-neutral-500">⭐ {Number(s.avg_rating).toFixed(1)}</p>
            </Link>
          ))}
          {!series?.length && (
            <p className="col-span-full text-sm text-neutral-500">Noch keine Serien veröffentlicht.</p>
          )}
        </div>
      </div>
    </div>
  );
}
