import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Animem
        </Link>

        <nav className="flex items-center gap-4 text-sm text-neutral-300">
          <Link href="/forum" className="hover:text-white">
            Forum
          </Link>
          <Link href="/support" className="hover:text-white">
            Support
          </Link>

          {user ? (
            <>
              {can.manageContent(user.role) && (
                <Link href="/admin" className="hover:text-white">
                  Admin
                </Link>
              )}
              <span className="text-neutral-500">{user.username}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">
                Anmelden
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
              >
                Registrieren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
