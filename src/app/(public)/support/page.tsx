import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import NewTicketForm from "@/components/tickets/NewTicketForm";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  RESOLVED: "Gelöst",
  CLOSED: "Geschlossen",
};

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, subject, status, priority, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Support</h1>

        <NewTicketForm />

        <div className="mt-6 space-y-2">
          {(tickets ?? []).map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3 hover:bg-neutral-900"
            >
              <span>{t.subject}</span>
              <span className="text-xs text-neutral-400">{STATUS_LABEL[t.status]}</span>
            </Link>
          ))}
          {!tickets?.length && (
            <p className="text-sm text-neutral-500">Du hast noch keine Support-Tickets erstellt.</p>
          )}
        </div>
      </div>
    </div>
  );
}
