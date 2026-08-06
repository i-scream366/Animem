import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { threadId, content } = await req.json();
  if (!threadId || !content) {
    return NextResponse.json({ error: "Inhalt fehlt" }, { status: 400 });
  }

  const supabase = createClient();

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("is_locked")
    .eq("id", threadId)
    .single();
  if (thread?.is_locked) {
    return NextResponse.json({ error: "Dieser Thread ist gesperrt" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({ thread_id: threadId, user_id: user.id, content })
    .select("*, user:user_id(username, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
