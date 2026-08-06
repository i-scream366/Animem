import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  RESOLVED: "Gelöst",
  CLOSED: "Geschlossen",
};

export default async function AdminTicketsPage() {
  const supabase = createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, subject, status, priority, created_at, user:user_id(username)")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Support-Tickets</h1>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Betreff</th>
              <th className="px-4 py-3 font-medium">Nutzer</th>
              <th className="px-4 py-3 font-medium">Priorität</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(tickets ?? []).map((t: any) => (
              <tr key={t.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/admin/tickets/${t.id}`} className="hover:text-indigo-400">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-400">{t.user?.username}</td>
                <td className="px-4 py-3 text-neutral-400">{t.priority}</td>
                <td className="px-4 py-3 text-neutral-400">{STATUS_LABEL[t.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
