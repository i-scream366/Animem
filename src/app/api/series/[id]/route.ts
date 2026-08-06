import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !can.manageContent(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = await req.json();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("series")
    .update({
      title: body.title,
      description: body.description,
      thumbnail_url: body.thumbnailUrl,
      banner_url: body.bannerUrl,
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("*, seasons(*, episodes(*)), genres:series_genres(genre:genres(*))")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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
