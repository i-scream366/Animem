import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/permissions";

export interface CurrentUser {
  id: string;
  username: string;
  role: Role;
  avatarUrl: string | null;
}

// Server-seitiger Helfer: liefert den eingeloggten Nutzer inkl. Rolle
// aus der `profiles`-Tabelle, oder null wenn nicht eingeloggt.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    username: profile.username,
    role: profile.role as Role,
    avatarUrl: profile.avatar_url,
  };
}
