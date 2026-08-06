import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// Legt eine Bewertung an oder aktualisiert die bestehende (1 Bewertung pro User+Ziel).
// avg_rating/ratings_count werden per DB-Trigger automatisch neu berechnet.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { targetType, seriesId, movieId, episodeId, value } = await req.json();

  if (!targetType || !value || value < 1 || value > 10) {
    return NextResponse.json({ error: "Ungültige Bewertung" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        user_id: user.id,
        target_type: targetType,
        series_id: seriesId ?? null,
        movie_id: movieId ?? null,
        episode_id: episodeId ?? null,
        value,
      },
      { onConflict: "user_id,target_type,series_id,movie_id,episode_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
