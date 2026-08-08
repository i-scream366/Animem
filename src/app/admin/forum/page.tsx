import { createClient } from "@/lib/supabase/server";

export default async function AdminForumPage() {
  const supabase = createClient();
  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, is_pinned, is_locked, category:category_id(name), user:user_id(username)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Forum-Moderation</h1>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Titel</th>
              <th className="px-4 py-3 font-medium">Kategorie</th>
              <th className="px-4 py-3 font-medium">Von</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(threads ?? []).map((t: any) => (
              <tr key={t.id}>
                <td className="px-4 py-3">{t.title}</td>
                <td className="px-4 py-3 text-neutral-400">{t.category?.name}</td>
                <td className="px-4 py-3 text-neutral-400">{t.user?.username}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {t.is_locked ? "Gesperrt" : t.is_pinned ? "Angepinnt" : "Normal"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Volle Moderationsfunktionen (Sperren/Pinnen/Löschen direkt hier) folgen als nächster Ausbauschritt.
      </p>
    </div>
  );
}
