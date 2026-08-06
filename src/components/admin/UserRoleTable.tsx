"use client";

import { useState } from "react";

interface UserRow {
  id: string;
  username: string;
  role: "OWNER" | "HEAD_ADMIN" | "ADMIN" | "USER";
  is_banned: boolean;
}

// Rollenzuweisung ist bewusst nur dem Owner vorbehalten (siehe lib/permissions.ts).
export default function UserRoleTable({
  initialUsers,
  canAssignRoles,
}: {
  initialUsers: UserRow[];
  canAssignRoles: boolean;
}) {
  const [users, setUsers] = useState(initialUsers);

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u)));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-neutral-400">
          <tr>
            <th className="px-4 py-3 font-medium">Nutzer</th>
            <th className="px-4 py-3 font-medium">Rolle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/[0.03]">
              <td className="px-4 py-3">{u.username}</td>
              <td className="px-4 py-3">
                {canAssignRoles ? (
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded-lg border border-white/10 bg-neutral-800 px-2 py-1 text-sm"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="HEAD_ADMIN">Head Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                ) : (
                  <span className="text-neutral-400">{u.role}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
