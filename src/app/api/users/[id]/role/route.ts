import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

// Rollenvergabe ist bewusst auf den Owner beschränkt.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !can.assignRoles(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!["OWNER", "HEAD_ADMIN", "ADMIN", "USER"].includes(role)) {
    return NextResponse.json({ error: "Ungültige Rolle" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
