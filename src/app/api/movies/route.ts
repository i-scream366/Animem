import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*, genres:movie_genres(genre:genres(*))")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can.manageContent(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, thumbnailUrl, bannerUrl, embedUrl, embedProvider, status, genres } = body;

  if (!title || !thumbnailUrl || !embedUrl) {
    return NextResponse.json(
      { error: "Titel, Thumbnail und Embed-URL sind Pflichtfelder" },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { data: movie, error } = await supabase
    .from("movies")
    .insert({
      title,
      slug: slugify(title),
      description,
      thumbnail_url: thumbnailUrl,
      banner_url: bannerUrl,
      embed_url: embedUrl,
      embed_provider: embedProvider || null,
      status,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const name of (genres as string[]) ?? []) {
    const { data: genre } = await supabase
      .from("genres")
      .upsert({ name, slug: slugify(name) }, { onConflict: "name" })
      .select()
      .single();
    if (genre) await supabase.from("movie_genres").insert({ movie_id: movie.id, genre_id: genre.id });
  }

  return NextResponse.json(movie, { status: 201 });
}
