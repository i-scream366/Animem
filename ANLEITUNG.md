# Animem — Komplette Anleitung (Android, 0€ Budget)

Diese Anleitung führt dich von den Projekt-Dateien bis zur laufenden, live erreichbaren
Webseite — alles vom Handy aus, ohne Kosten.

Du brauchst am Ende 3 kostenlose Accounts: **GitHub**, **Supabase**, **Vercel**.

---

## Schritt 1 — GitHub-Repo anlegen

1. Gehe im Handy-Browser auf **github.com** → registrieren/einloggen (kostenlos).
2. Oben rechts auf **+** → **New repository**.
3. Name: `animem`. Sichtbarkeit: **Private** (empfohlen) oder Public. **Create repository**.
4. Lade unten die Datei **`animem.zip`** herunter (liegt in deinen Downloads).

## Schritt 2 — Projekt in den Codespace laden

1. Öffne dein neues Repo auf github.com.
2. Grüner Button **Code** → Reiter **Codespaces** → **Create codespace on main**.
3. Es öffnet sich ein vollständiges VS Code im Browser (läuft in der Cloud, nicht auf deinem Handy — deshalb ruckelt nichts).
4. Im Explorer links: Rechtsklick (bzw. lang drücken) auf den Ordner → **Upload...** → wähle die `animem.zip` aus deinen Downloads.
5. Terminal öffnen (Menü ☰ → Terminal → New Terminal) und ausführen:
   ```bash
   unzip animem.zip -d .
   rm animem.zip
   ```
6. Alles committen:
   ```bash
   git add -A
   git commit -m "Initial commit"
   git push
   ```

## Schritt 3 — Supabase-Projekt anlegen (Datenbank + Login)

1. Gehe auf **supabase.com** → registrieren (kostenlos, z. B. mit GitHub-Login).
2. **New project** → Name `animem`, Datenbank-Passwort vergeben (merken!), Region wählen → **Create**.
   Das dauert 1–2 Minuten.
3. Links im Menü: **SQL Editor** → **New query**.
4. Öffne im Codespace die Datei `supabase/schema.sql`, kopiere **den kompletten Inhalt**,
   füge ihn im Supabase SQL Editor ein → **Run**.
   → Das legt alle Tabellen, Sicherheitsregeln und Automatiken an.
5. Links im Menü: **Project Settings** → **API**.
   Kopiere dir **Project URL** und den **anon public** Key.

## Schritt 4 — Umgebungsvariablen setzen

1. Im Codespace: neue Datei `.env.local` im Projekt-Hauptordner anlegen.
2. Inhalt einfügen (mit deinen echten Werten aus Schritt 3.5):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_ANON_KEY
   ```

## Schritt 5 — Projekt starten

Im Codespace-Terminal:
```bash
npm install
npm run dev
```
Codespaces zeigt unten eine Benachrichtigung **"Port 3000 is now available"** →
**Open in Browser** antippen. Die Seite läuft jetzt — auch von deinem Handy aus erreichbar.

## Schritt 6 — Ersten Owner-Account anlegen

1. Auf der laufenden Seite: **Registrieren** → Konto mit deinem Benutzernamen erstellen.
2. Zurück im Supabase SQL Editor, neue Query:
   ```sql
   update profiles set role = 'OWNER' where username = 'DEIN_BENUTZERNAME';
   ```
   → **Run**. Jetzt hast du vollen Zugriff auf `/admin`.
3. Optional: über `/admin/users` kannst du ab jetzt bequem weitere Admins ernennen,
   ohne nochmal SQL zu schreiben.

## Schritt 7 — Erste Inhalte anlegen

1. Gehe auf `/admin/series` → **Neue Serie** → Titel, Thumbnail-URL, Staffeln/Episoden mit
   den Embed-URLs deines Video-Hosters eintragen → Speichern.
2. Gleiches für Filme unter `/admin/movies`.
3. Auf der Startseite (`/`) erscheint automatisch das Sieger-Treppchen, sobald mindestens
   3 veröffentlichte Serien mit Bewertungen existieren.

## Schritt 8 — Live veröffentlichen (Deployment)

1. Gehe auf **vercel.com** → registrieren mit deinem GitHub-Account.
2. **Add New** → **Project** → dein `animem`-Repo auswählen → **Import**.
3. Bei **Environment Variables** die gleichen zwei Werte wie in `.env.local` eintragen.
4. **Deploy**. Nach ~1 Minute bekommst du eine echte, öffentliche URL
   (z. B. `animem.vercel.app`) — kostenlos, auch für später.

## Danach: weiterentwickeln

- Änderungen machst du weiter im Codespace (`github.com` → dein Repo → **Code** → **Codespaces**).
- Jeder `git push` löst automatisch ein neues Deployment auf Vercel aus.
- Spck Editor kannst du parallel nutzen, um unterwegs schnell einzelne Dateien
  anzusehen oder kleine Änderungen zu committen — für `npm install`/`npm run dev`
  bitte weiter den Codespace nutzen.

---

### Kurz-Checkliste
- [ ] GitHub-Repo erstellt, Code hochgeladen
- [ ] Supabase-Projekt erstellt, `schema.sql` ausgeführt
- [ ] `.env.local` mit URL + Key befüllt
- [ ] `npm install && npm run dev` läuft
- [ ] Eigenen Account registriert und per SQL zu `OWNER` gemacht
- [ ] Erste Serie/Film im Admin angelegt
- [ ] Auf Vercel deployt
