import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import MobileNavDrawer from "./MobileNavDrawer";

export default async function Navbar() {
  const user = await getCurrentUser();

  let watchlistCount = 0;
  let subscriptionsCount = 0;

  if (user) {
    const supabase = createClient();
    const [watchlist, subscriptions] = await Promise.all([
      supabase.from("watchlist_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    watchlistCount = watchlist.count ?? 0;
    subscriptionsCount = subscriptions.count ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Animem
        </Link>

        <MobileNavDrawer
          user={
            user
              ? { username: user.username, role: user.role, isStaff: can.manageContent(user.role) }
              : null
          }
          counts={{ watchlist: watchlistCount, subscriptions: subscriptionsCount }}
        />
      </div>
    </header>
  );
}
