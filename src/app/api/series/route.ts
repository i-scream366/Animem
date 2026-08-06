import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("series")
    .select("*, genres:series_genres(genre:genres(*))")
    .order("avg_rating", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can.manageContent(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, thumbnailUrl, bannerUrl, status, genres, seasons } = body;

  if (!title || !thumbnailUrl) {
    return NextResponse.json({ error: "Titel und Thumbnail sind Pflichtfelder" }, { status: 400 });
  }

  const supabase = createClient();

  const { data: series, error: seriesError } = await supabase
    .from("series")
    .insert({
      title,
      slug: slugify(title),
      description,
      thumbnail_url: thumbnailUrl,
      banner_url: bannerUrl,
      status,
      created_by: user.id,
    })
    .select()
    .single();

  if (seriesError) return NextResponse.json({ error: seriesError.message }, { status: 500 });

  // Genres: vorhandene finden/anlegen und verknüpfen
  for (const name of (genres as string[]) ?? []) {
    const { data: genre } = await supabase
      .from("genres")
      .upsert({ name, slug: slugify(name) }, { onConflict: "name" })
      .select()
      .single();
    if (genre) {
      await supabase.from("series_genres").insert({ series_id: series.id, genre_id: genre.id });
    }
  }

  // Staffeln + Episoden verschachtelt anlegen
  for (const season of seasons ?? []) {
    const { data: createdSeason } = await supabase
      .from("seasons")
      .insert({ series_id: series.id, number: season.number, title: season.title || null })
      .select()
      .single();

    if (createdSeason) {
      const episodeRows = (season.episodes ?? []).map((ep: any) => ({
        season_id: createdSeason.id,
        number: ep.number,
        title: ep.title,
        embed_url: ep.embedUrl,
        embed_provider: ep.embedProvider || null,
        status: "PUBLISHED",
      }));
      if (episodeRows.length) await supabase.from("episodes").insert(episodeRows);
    }
  }

  const { data: full } = await supabase
    .from("series")
    .select("*, seasons(*, episodes(*)), genres:series_genres(genre:genres(*))")
    .eq("id", series.id)
    .single();

  return NextResponse.json(full, { status: 201 });
}
