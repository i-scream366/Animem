import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get("category");
  const supabase = createClient();

  let query = supabase
    .from("forum_threads")
    .select(
      "id, title, is_pinned, is_locked, created_at, user:user_id(username, avatar_url), category:category_id(slug), posts:forum_posts(count)"
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (categorySlug) {
    const { data: category } = await supabase
      .from("forum_categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (category) query = query.eq("category_id", category.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { categoryId, title, content } = await req.json();
  if (!categoryId || !title || !content) {
    return NextResponse.json({ error: "Titel, Kategorie und Inhalt sind Pflichtfelder" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .insert({ category_id: categoryId, user_id: user.id, title })
    .select()
    .single();

  if (threadError) return NextResponse.json({ error: threadError.message }, { status: 500 });

  const { error: postError } = await supabase
    .from("forum_posts")
    .insert({ thread_id: thread.id, user_id: user.id, content });

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });
  return NextResponse.json(thread, { status: 201 });
}
