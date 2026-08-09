import { createClient } from "@/lib/supabase/server";
import SeriesTable from "@/components/admin/SeriesTable";

export default async function AdminSeriesPage() {
  const supabase = createClient();

  // Getrennte, einfache Abfragen statt verschachtelter Embeds — robuster gegen RLS/Join-Fehler,
  // die sonst still zu einer leeren Liste führen konnten.
  const [{ data: series, error: seriesError }, { data: genreLinks }, { data: tagLinks }] = await Promise.all([
    supabase.from("series").select("*, seasons(*, episodes(*))").order("created_at", { ascending: false }),
    supabase.from("series_genres").select("series_id, genre:genres(name)"),
    supabase.from("series_tags").select("series_id, tag:tags(name)"),
  ]);

  const seriesWithMeta = (series ?? []).map((s) => ({
    ...s,
    genres: (genreLinks ?? [])
      .filter((g: any) => g.series_id === s.id)
      .map((g: any) => ({ genre: g.genre })),
    tags: (tagLinks ?? [])
      .filter((t: any) => t.series_id === s.id)
      .map((t: any) => ({ tag: t.tag })),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serien verwalten</h1>
      </div>
      {seriesError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          Fehler beim Laden: {seriesError.message}
        </p>
      )}
      <SeriesTable initialSeries={seriesWithMeta} />
    </div>
  );
}
