import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Clapperboard,
  Film,
  Users,
  MessagesSquare,
  LifeBuoy,
  Settings,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { can, ROLE_LABELS, type Role } from "@/lib/permissions";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: Role;
}[] = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard, minRole: "ADMIN" },
  { href: "/admin/series", label: "Serien", icon: Clapperboard, minRole: "ADMIN" },
  { href: "/admin/movies", label: "Filme", icon: Film, minRole: "ADMIN" },
  { href: "/admin/forum", label: "Forum", icon: MessagesSquare, minRole: "ADMIN" },
  { href: "/admin/tickets", label: "Support-Tickets", icon: LifeBuoy, minRole: "ADMIN" },
  { href: "/admin/users", label: "Admins & Nutzer", icon: Users, minRole: "HEAD_ADMIN" },
  { href: "/admin/settings", label: "Einstellungen", icon: Settings, minRole: "OWNER" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Nur ADMIN, HEAD_ADMIN, OWNER dürfen das Dashboard überhaupt betreten
  if (!user || !can.manageContent(user.role)) {
    redirect("/");
  }

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.minRole === "OWNER") return user.role === "OWNER";
    if (item.minRole === "HEAD_ADMIN") return can.manageAdmins(user.role);
    return can.manageContent(user.role);
  });

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className="flex w-64 flex-col border-r border-white/10 bg-neutral-900/60 px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-lg font-bold tracking-tight">Animem</p>
          <p className="text-xs text-neutral-400">Admin-Bereich</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-lg bg-white/5 px-3 py-3 text-xs">
          <p className="font-medium text-neutral-200">{user.username}</p>
          <p className="text-neutral-400">{ROLE_LABELS[user.role]}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
