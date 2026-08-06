import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

// User sieht nur eigene Tickets, Staff (Admin+) sieht alle — wird zusätzlich
// per Row-Level-Security in Supabase erzwungen, hier nur fürs Filtern der Query.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const supabase = createClient();
  let query = supabase
    .from("tickets")
    .select("*, user:user_id(username), messages:ticket_messages(count)")
    .order("updated_at", { ascending: false });

  if (!can.moderate(user.role)) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { subject, message, priority } = await req.json();
  if (!subject || !message) {
    return NextResponse.json({ error: "Betreff und Nachricht sind Pflichtfelder" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({ user_id: user.id, subject, priority: priority || "MEDIUM" })
    .select()
    .single();

  if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

  await supabase
    .from("ticket_messages")
    .insert({ ticket_id: ticket.id, sender_id: user.id, content: message, is_staff: false });

  return NextResponse.json(ticket, { status: 201 });
}
