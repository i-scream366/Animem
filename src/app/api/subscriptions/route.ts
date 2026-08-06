import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, notify_on_new_episode, series:series_id(id, title, slug, thumbnail_url)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { seriesId } = await req.json();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ user_id: user.id, series_id: seriesId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { seriesId } = await req.json();
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("series_id", seriesId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
