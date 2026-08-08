import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchBar from "@/components/search/SearchBar";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() ?? "";
  const supabase = createClient();

  let series: any[] = [];
  let movies: any[] = [];

  if (query) {
    const [seriesRes, moviesRes] = await Promise.all([
      supabase
        .from("series")
        .select("id, slug, title, thumbnail_url")
        .eq("status", "PUBLISHED")
        .ilike("title", `%${query}%`)
        .limit(24),
      supabase
        .from("movies")
        .select("id, slug, title, thumbnail_url")
        .eq("status", "PUBLISHED")
        .ilike("title", `%${query}%`)
        .limit(24),
    ]);
    series = seriesRes.data ?? [];
    movies = moviesRes.data ?? [];
  } else {
    const [seriesRes, moviesRes] = await Promise.all([
      supabase.from("series").select("id, slug, title, thumbnail_url").eq("status", "PUBLISHED").order("title").limit(24),
      supabase.from("movies").select("id, slug, title, thumbnail_url").eq("status", "PUBLISHED").order("title").limit(24),
    ]);
    series = seriesRes.data ?? [];
    movies = moviesRes.data ?? [];
  }

  const hasResults = series.length + movies.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-2xl font-bold">Suche</h1>
        <SearchBar />

        {!hasResults && <p className="text-sm text-neutral-500">Keine Ergebnisse gefunden.</p>}

        {!!series.length && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Serien</h2>
            <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {series.map((s) => (
                <Link key={s.id} href={`/series/${s.slug}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
                    <Image src={s.thumbnail_url} alt={s.title} fill className="object-cover" />
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-300">{s.title}</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {!!movies.length && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Filme</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {movies.map((m) => (
                <Link key={m.id} href={`/movies/${m.slug}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
                    <Image src={m.thumbnail_url} alt={m.title} fill className="object-cover" />
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-300">{m.title}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
