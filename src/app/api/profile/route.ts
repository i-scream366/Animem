import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// Eigenes Profil (Avatar, Bio) bearbeiten
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { avatarUrl, bio } = await req.json();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl || null, bio: bio || null })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
