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
import { can, type Role } from "@/lib/permissions";
import AdminShell from "@/components/admin/AdminShell";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: string;
  minRole: Role;
}[] = [
  { href: "/admin", label: "Übersicht", icon: "LayoutDashboard", minRole: "ADMIN" },
  { href: "/admin/series", label: "Serien", icon: "Clapperboard", minRole: "ADMIN" },
  { href: "/admin/movies", label: "Filme", icon: "Film", minRole: "ADMIN" },
  { href: "/admin/forum", label: "Forum", icon: "MessagesSquare", minRole: "ADMIN" },
  { href: "/admin/tickets", label: "Support-Tickets", icon: "LifeBuoy", minRole: "ADMIN" },
  { href: "/admin/users", label: "Admins & Nutzer", icon: "Users", minRole: "HEAD_ADMIN" },
  { href: "/admin/settings", label: "Einstellungen", icon: "Settings", minRole: "OWNER" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !can.manageContent(user.role)) {
    redirect("/");
  }

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.minRole === "OWNER") return user.role === "OWNER";
    if (item.minRole === "HEAD_ADMIN") return can.manageAdmins(user.role);
    return can.manageContent(user.role);
  });

  return (
    <AdminShell navItems={visibleItems} username={user.username} role={user.role}>
      {children}
    </AdminShell>
  );
}
