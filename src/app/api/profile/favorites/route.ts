import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// Sieger-Treppchen-Platz (1-3) setzen oder ersetzen
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { rank, seriesId, movieId } = await req.json();
  if (![1, 2, 3].includes(rank)) {
    return NextResponse.json({ error: "Ungültiger Platz" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profile_favorites")
    .upsert(
      { user_id: user.id, rank, series_id: seriesId ?? null, movie_id: movieId ?? null },
      { onConflict: "user_id,rank" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { rank } = await req.json();
  const supabase = createClient();
  const { error } = await supabase
    .from("profile_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("rank", rank);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
