"use client";

import { createBrowserClient } from "@supabase/ssr";

// Für Client Components (z.B. Login-/Register-Formular, Live-Interaktionen)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
