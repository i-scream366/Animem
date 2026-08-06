import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ticket_messages")
    .select("*, sender:sender_id(username, avatar_url)")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Nachricht fehlt" }, { status: 400 });

  const isStaff = can.moderate(user.role);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: params.id, sender_id: user.id, content, is_staff: isStaff })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Staff-Antwort setzt das Ticket automatisch auf "IN_PROGRESS"
  if (isStaff) {
    await supabase
      .from("tickets")
      .update({ status: "IN_PROGRESS", updated_at: new Date().toISOString() })
      .eq("id", params.id);
  }

  return NextResponse.json(data, { status: 201 });
}
