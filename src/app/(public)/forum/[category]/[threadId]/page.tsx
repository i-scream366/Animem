import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import ReplyForm from "@/components/forum/ReplyForm";

export default async function ThreadPage({
  params,
}: {
  params: { category: string; threadId: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("id, title, is_locked, user:user_id(username)")
    .eq("id", params.threadId)
    .single();

  if (!thread) notFound();

  const { data: posts } = await supabase
    .from("forum_posts")
    .select("id, content, created_at, user:user_id(username, avatar_url)")
    .eq("thread_id", params.threadId)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-xl font-bold">{thread.title}</h1>
        <p className="mb-6 text-sm text-neutral-500">gestartet von {(thread.user as any)?.username}</p>

        <div className="space-y-3">
          {(posts ?? []).map((post: any) => (
            <div key={post.id} className="rounded-lg border border-white/10 bg-neutral-900/60 p-4">
              <p className="mb-1 text-xs font-medium text-indigo-400">{post.user?.username}</p>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>

        {thread.is_locked ? (
          <p className="mt-4 text-sm text-neutral-500">Dieser Thread ist gesperrt.</p>
        ) : user ? (
          <ReplyForm threadId={thread.id} />
        ) : (
          <p className="mt-4 text-sm text-neutral-500">Melde dich an, um zu antworten.</p>
        )}
      </div>
    </div>
  );
}
