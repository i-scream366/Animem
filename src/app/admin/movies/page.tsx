import { createClient } from "@/lib/supabase/server";
import MovieTable from "@/components/admin/MovieTable";

export default async function AdminMoviesPage() {
  const supabase = createClient();
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Filme verwalten</h1>
      <MovieTable initialMovies={movies ?? []} />
    </div>
  );
}
