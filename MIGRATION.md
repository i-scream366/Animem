# Migration: Prisma → Supabase-JS

Aus `prisma/schema.prisma` wurde `supabase/schema.sql` (reines SQL). Grund: Prisma braucht eine
kompilierte Engine-Binary, die in browserbasierten Umgebungen wie StackBlitz nicht läuft — für
Entwicklung ausschließlich vom Handy aus (ohne PC/Budget) ist Supabase-JS die praktikablere Wahl,
da es nur HTTP/Fetch nutzt.

`prisma/schema.prisma` bleibt als lesbare Referenz für das Datenmodell erhalten, wird aber
**nicht mehr ausgeführt** — Quelle der Wahrheit ist jetzt `supabase/schema.sql`.

## Setup (kostenlos, ohne PC)

1. **Supabase-Projekt anlegen** (kostenlos): [supabase.com](https://supabase.com) → "New Project".
2. **SQL Editor** im Supabase-Dashboard öffnen → kompletten Inhalt von `supabase/schema.sql`
   einfügen → "Run". Das legt alle Tabellen, Trigger und Sicherheitsregeln (Row Level Security) an.
3. **API-Keys kopieren**: Project Settings → API → `Project URL` und `anon public` Key.
4. `.env.example` zu `.env.local` kopieren und die beiden Werte eintragen.
5. **Erste Owner-Rolle vergeben**: Nach der ersten Registrierung im SQL Editor einmalig ausführen:
   ```sql
   update profiles set role = 'OWNER' where username = 'DEIN_BENUTZERNAME';
   ```
   Alle weiteren Admin-Rollen vergibst du danach bequem über `/admin/users` in der App.

## Entwicklung vom Android-Handy

1. Repo bei **GitHub** anlegen (kostenlos), Projekt hochladen.
2. **GitHub Codespaces** (60 Std./Monat gratis) oder **StackBlitz** im Handy-Browser öffnen,
   Repo importieren.
3. `.env.local` mit den Supabase-Keys anlegen, `npm install`, `npm run dev`.
4. Deployment: Repo bei **Vercel** (kostenlos) verbinden → Umgebungsvariablen eintragen → fertig.

Spck Editor eignet sich weiterhin gut, um einzelne Dateien unterwegs schnell zu lesen/anzupassen
und zu committen — zum Ausführen des Projekts bitte Codespaces/StackBlitz nutzen.
