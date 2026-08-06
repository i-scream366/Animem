import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id, added_at, series:series_id(id, title, slug, thumbnail_url), movie:movie_id(id, title, slug, thumbnail_url)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { seriesId, movieId } = await req.json();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("watchlist_items")
    .insert({ user_id: user.id, series_id: seriesId ?? null, movie_id: movieId ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { seriesId, movieId } = await req.json();
  const supabase = createClient();
  let query = supabase.from("watchlist_items").delete().eq("user_id", user.id);
  query = seriesId ? query.eq("series_id", seriesId) : query.eq("movie_id", movieId);
  const { error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
