# Animem — Technisches Konzept

## 1. Tech-Stack & Begründung

| Bereich          | Wahl                                   | Begründung |
|-------------------|-----------------------------------------|------------|
| Framework         | **Next.js 14 (App Router)**            | Server Components sparen Client-JS für datenlastige Seiten (Serien-Listen, Admin-Tabellen); API-Routes decken das Backend ohne separates Projekt; SEO-relevant für eine Streaming-Plattform, die über Google gefunden werden will. |
| Sprache           | **TypeScript**                          | Bei diesem Datenmodell (Serie → Staffel → Episode, Rollen, Ratings) verhindert Typsicherheit viele Laufzeitfehler im CMS. |
| Styling           | **Tailwind CSS**                        | Schnelles, konsistentes UI für Podium, Dashboard-Tabellen, Formulare ohne CSS-Wildwuchs. |
| Datenbank         | **PostgreSQL via Supabase**            | Relationale Struktur passt zur klar verschachtelten Content-Hierarchie (Serie/Staffel/Episode, Many-to-Many bei Genres/Tags); Supabase liefert Auth, Storage (Thumbnails) und Realtime (z. B. Live-Ticket-Chat) aus einer Hand. MongoDB wäre bei so vielen relationalen Verknüpfungen (Ratings, Watchlist, Forum) nur mit viel manueller Join-Logik sauber abzubilden. |
| ORM               | **Prisma**                              | Typsichere Queries, einfache Migrationen, gut lesbares Schema als Single Source of Truth. |
| Auth              | **NextAuth.js (Credentials-Provider)** | Rollenbasierte Sessions (Owner/Head Admin/Admin/User) lassen sich sauber im JWT abbilden; alternativ direkt Supabase Auth, wenn zusätzlich OAuth-Login gewünscht ist. |
| State (Client)    | **Zustand**                             | Leichtgewichtig für UI-State (Modals, Player-Fortschritt), kein Overhead wie Redux. |
| Formulare         | **React Hook Form + Zod**              | Validierung von Embed-URLs, Pflichtfeldern im CMS ohne Boilerplate. |
| Animation         | **Framer Motion**                       | Für das Podium (Stufen-Reveal, Kronen-Animation) und dezente Dashboard-Übergänge. |
| Icons             | **lucide-react**                        | Konsistentes, leichtes Icon-Set. |

**Warum keine eigene Video-Infrastruktur?** Da Videos ausschließlich per Embed/iFrame von externen Hostern eingebunden werden, entfällt Transcoding, CDN und Storage für Videodateien komplett — die Plattform speichert nur Metadaten und Embed-URLs. Das hält Infrastrukturkosten und Rechtsrisiko niedrig.

## 2. Ordnerstruktur

```
animem/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                    # Startseite inkl. Sieger-Treppchen
│   │   │   ├── series/[slug]/page.tsx
│   │   │   ├── series/[slug]/s/[s]/e/[e]/page.tsx   # Episoden-Player
│   │   │   ├── movies/[slug]/page.tsx
│   │   │   ├── forum/page.tsx
│   │   │   ├── forum/[category]/[thread]/page.tsx
│   │   │   ├── profile/[username]/page.tsx
│   │   │   └── support/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Rollenprüfung + Sidebar
│   │   │   ├── page.tsx                    # Übersicht/Stats
│   │   │   ├── series/page.tsx
│   │   │   ├── movies/page.tsx
│   │   │   ├── users/page.tsx              # nur Head Admin/Owner
│   │   │   ├── forum/page.tsx
│   │   │   └── tickets/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── series/route.ts
│   │       ├── series/[id]/route.ts
│   │       ├── movies/route.ts
│   │       ├── episodes/[id]/route.ts
│   │       ├── ratings/route.ts
│   │       ├── watchlist/route.ts
│   │       ├── subscriptions/route.ts
│   │       ├── forum/route.ts
│   │       └── tickets/route.ts
│   ├── components/
│   │   ├── podium/TopThreePodium.tsx
│   │   ├── admin/SeriesTable.tsx
│   │   ├── admin/SeriesFormModal.tsx
│   │   ├── player/EmbedPlayer.tsx
│   │   ├── forum/ThreadList.tsx
│   │   └── ui/ (Buttons, Inputs, Modal-Primitives)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── slugify.ts
│   │   └── utils.ts
│   ├── hooks/
│   └── store/                              # Zustand-Stores
├── public/
├── package.json
└── tailwind.config.ts
```

## 3. Rollen-Prinzip (Kurzfassung)

`USER < ADMIN < HEAD_ADMIN < OWNER` — jede höhere Rolle erbt automatisch die Rechte darunter (siehe `lib/permissions.ts`). Rollenzuweisung ist bewusst auf `OWNER` beschränkt, damit sich niemand selbst zum Admin befördern kann.

## 4. Nächste Schritte

Im nächsten Schritt liefere ich auf Wunsch: Episoden-Player-Komponente (Embed/iFrame sicher eingebettet inkl. Sandbox-Attributen), Watchlist-/Abo-/Bewertungs-API, Forum- und Ticket-CRUD sowie die Registrierung/Login-Seiten.
