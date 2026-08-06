export type Role = "OWNER" | "HEAD_ADMIN" | "ADMIN" | "USER";

// Rang der Rolle — je höher, desto mehr Rechte
const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  ADMIN: 1,
  HEAD_ADMIN: 2,
  OWNER: 3,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export const can = {
  // Content: Admin, Head Admin & Owner dürfen Content verwalten
  manageContent: (role: Role) => hasMinRole(role, "ADMIN"),
  // Nutzer & Rollen verwalten: nur Head Admin & Owner
  manageAdmins: (role: Role) => hasMinRole(role, "HEAD_ADMIN"),
  // Rollen VERGEBEN (z.B. jemanden zum Admin machen): nur Owner
  assignRoles: (role: Role) => hasMinRole(role, "OWNER"),
  // Tickets & Forum moderieren: Admin aufwärts
  moderate: (role: Role) => hasMinRole(role, "ADMIN"),
  // Globale Einstellungen: nur Owner
  manageSettings: (role: Role) => hasMinRole(role, "OWNER"),
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  HEAD_ADMIN: "Head Admin",
  ADMIN: "Admin",
  USER: "User",
};
