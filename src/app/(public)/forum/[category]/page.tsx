import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewThreadForm from "@/components/forum/NewThreadForm";

export default async function ForumCategoryPage({ params }: { params: { category: string } }) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("slug", params.category)
    .single();

  if (!category) notFound();

  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, is_pinned, created_at, user:user_id(username)")
    .eq("category_id", category.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold">{category.name}</h1>
        <p className="mb-6 text-sm text-neutral-400">{category.description}</p>

        <NewThreadForm categoryId={category.id} categorySlug={category.slug} />

        <div className="mt-6 space-y-2">
          {(threads ?? []).map((t: any) => (
            <Link
              key={t.id}
              href={`/forum/${params.category}/${t.id}`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3 hover:bg-neutral-900"
            >
              <span>
                {t.is_pinned && "📌 "}
                {t.title}
              </span>
              <span className="text-xs text-neutral-500">von {t.user?.username}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
