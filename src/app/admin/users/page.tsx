import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import UserRoleTable from "@/components/admin/UserRoleTable";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || !can.manageAdmins(user.role)) redirect("/admin");

  const supabase = createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, role, is_banned, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admins & Nutzer</h1>
      <UserRoleTable initialUsers={users ?? []} canAssignRoles={user.role === "OWNER"} />
    </div>
  );
}
