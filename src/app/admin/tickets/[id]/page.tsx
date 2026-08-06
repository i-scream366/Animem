import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TicketChat from "@/components/tickets/TicketChat";

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, subject, status, user:user_id(username)")
    .eq("id", params.id)
    .single();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, content, is_staff, created_at, sender:sender_id(username)")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">{ticket.subject}</h1>
      <p className="mb-6 text-sm text-neutral-400">von {(ticket.user as any)?.username}</p>
      <TicketChat ticketId={ticket.id} messages={(messages as any) ?? []} />
    </div>
  );
}
