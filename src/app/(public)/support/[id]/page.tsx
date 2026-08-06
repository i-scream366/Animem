import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import TicketChat from "@/components/tickets/TicketChat";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const supabase = createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, subject, status, user_id")
    .eq("id", params.id)
    .single();

  if (!ticket || ticket.user_id !== user.id) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, content, is_staff, created_at, sender:sender_id(username)")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-xl font-bold">{ticket.subject}</h1>
        <TicketChat ticketId={ticket.id} messages={(messages as any) ?? []} />
      </div>
    </div>
  );
}
