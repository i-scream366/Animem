import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { slugify } from "@/lib/slugify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !can.manageContent(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, thumbnailUrl, bannerUrl, status, genres, tags, seasons } = body;
  const supabase = createClient();

  // 1) Basisdaten aktualisieren
  const { error: updateError } = await supabase
    .from("series")
    .update({
      title,
      description,
      thumbnail_url: thumbnailUrl,
      banner_url: bannerUrl,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 2) Genres neu setzen (einfach: alle Verknüpfungen löschen, neu anlegen)
  if (Array.isArray(genres)) {
    await supabase.from("series_genres").delete().eq("series_id", params.id);
    for (const name of genres as string[]) {
      const { data: genre } = await supabase
        .from("genres")
        .upsert({ name, slug: slugify(name) }, { onConflict: "name" })
        .select()
        .single();
      if (genre) await supabase.from("series_genres").insert({ series_id: params.id, genre_id: genre.id });
    }
  }

  // 3) Tags neu setzen (gleiches Prinzip)
  if (Array.isArray(tags)) {
    await supabase.from("series_tags").delete().eq("series_id", params.id);
    for (const name of tags as string[]) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name, slug: slugify(name) }, { onConflict: "name" })
        .select()
        .single();
      if (tag) await supabase.from("series_tags").insert({ series_id: params.id, tag_id: tag.id });
    }
  }

  // 4) Staffeln & Episoden synchronisieren: vorhandene (mit id) updaten, neue (ohne id) anlegen
  if (Array.isArray(seasons)) {
    for (const season of seasons) {
      let seasonId = season.id as string | undefined;

      if (seasonId) {
        await supabase.from("seasons").update({ number: season.number, title: season.title || null }).eq("id", seasonId);
      } else {
        const { data: createdSeason } = await supabase
          .from("seasons")
          .insert({ series_id: params.id, number: season.number, title: season.title || null })
          .select()
          .single();
        seasonId = createdSeason?.id;
      }

      if (!seasonId) continue;

      for (const ep of season.episodes ?? []) {
        if (ep.id) {
          await supabase
            .from("episodes")
            .update({
              number: ep.number,
              title: ep.title,
              embed_url: ep.embedUrl,
              embed_provider: ep.embedProvider || null,
            })
            .eq("id", ep.id);
        } else {
          await supabase.from("episodes").insert({
            season_id: seasonId,
            number: ep.number,
            title: ep.title,
            embed_url: ep.embedUrl,
            embed_provider: ep.embedProvider || null,
            status: "PUBLISHED",
          });
        }
      }
    }
  }

  const { data: full, error: fetchError } = await supabase
    .from("series")
    .select("*, seasons(*, episodes(*)), genres:series_genres(genre:genres(*)), tags:series_tags(tag:tags(*))")
    .eq("id", params.id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json(full);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  // Löschen ist bewusst restriktiver: nur Head Admin & Owner
  if (!user || !can.manageAdmins(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("series").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
