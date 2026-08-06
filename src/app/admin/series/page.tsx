import { createClient } from "@/lib/supabase/server";
import SeriesTable from "@/components/admin/SeriesTable";

export default async function AdminSeriesPage() {
  const supabase = createClient();
  const { data: series } = await supabase
    .from("series")
    .select("*, seasons(*, episodes(*))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serien verwalten</h1>
      </div>
      <SeriesTable initialSeries={series ?? []} />
    </div>
  );
}
