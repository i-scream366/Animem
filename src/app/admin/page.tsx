import { createClient } from "@/lib/supabase/server";
import { Clapperboard, Film, Users, LifeBuoy } from "lucide-react";

async function getStats() {
  const supabase = createClient();
  const [series, movies, users, tickets] = await Promise.all([
    supabase.from("series").select("id", { count: "exact", head: true }),
    supabase.from("movies").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
  ]);

  return {
    seriesCount: series.count ?? 0,
    movieCount: movies.count ?? 0,
    userCount: users.count ?? 0,
    openTickets: tickets.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Serien", value: stats.seriesCount, icon: Clapperboard },
    { label: "Filme", value: stats.movieCount, icon: Film },
    { label: "Registrierte Nutzer", value: stats.userCount, icon: Users },
    { label: "Offene Tickets", value: stats.openTickets, icon: LifeBuoy },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Übersicht</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-neutral-900/60 p-5">
            <Icon className="mb-3 h-5 w-5 text-neutral-400" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-neutral-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
