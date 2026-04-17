# Yoga Webseite Tanja – Website Dev

One-Pager für eine Yogalehrerin (Next.js): öffentliche Landingpage mit Fokus auf **Kursbuchungs-App** für Bestandskunden und **Kontaktformular** für Neukunden; **Admin** unter `/admin` zur Content-Pflege.

## Dokumentation (Single Source of Truth)

| Datei | Inhalt |
|--------|--------|
| [project-brief.md](./project-brief.md) | Ziele, Zielgruppen, Kernfunktionen, **Nicht-Ziele** |
| [content-model.md](./content-model.md) | Felder, Sektionen, Anker, Validierungsregeln für `SiteContent` |
| [types/site-content.ts](./types/site-content.ts) | TypeScript-Typen (canonical, mit Diskriminated Union für Kurse) |
| [tech-decisions.md](./tech-decisions.md) | Stack, UI-Ansatz, **noch offene** Entscheidungen |
| [docs/architecture.md](./docs/architecture.md) | App-Bereiche, Routing, Datenfluss, Komponenten, Erweiterbarkeit |
| [AGENTS.md](./AGENTS.md) | Kurzreferenz für KI-Agenten und neue Chats |

### Weitere Spezifikationen

| Datei | Inhalt |
|--------|--------|
| [site-structure.md](./site-structure.md) | One-Pager: Sektionen, Zweck und Inhalte pro Bereich |
| [component-map.md](./component-map.md) | Geplante Layout-, Sektions- und Domain-Komponenten |
| [build-plan.md](./build-plan.md) | Phasenplan: Lesepfad/Seed → Public (inkl. Legal-Routen) → Admin → Kontakt/Consent → Deploy |
| [admin-scope.md](./admin-scope.md) | Admin-Dashboard: bearbeitbare Bereiche und Felder |
| [legal-and-forms.md](./legal-and-forms.md) | Kontaktformular-Felder, Impressum/Datenschutz, technische Anforderungen |

Änderungen am fachlichen oder technischen Konzept **zuerst in diesen Dateien** festhalten, dann implementieren.

## Stack (festgelegt)

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **GitHub**, **Netlify** (Deployment + **Netlify Blobs** für Admin-Medien), Domain **IONOS**

## Medien

- **Hero-Bild:** `public/images/hero.png` (wird von `HeroSection` geladen). Ohne diese Datei bleibt die Hero-Fläche als graue Karte sichtbar, aber ohne Foto.
- **Kurz-„Über mich“-Teaser:** unter dem Hero in [`components/sections/about-teaser-section.tsx`](./components/sections/about-teaser-section.tsx); innere Karte wie Hero-Rahmen, kein zweites Bild. Inhalt soll zu `about` in [`data/site-content.json`](./data/site-content.json) passen (Spec: [`content-model.md`](./content-model.md)).

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Mit [pnpm](https://pnpm.io): `pnpm install` und `pnpm dev`.

- **Öffentliche Site:** [http://localhost:3000](http://localhost:3000)
- **Admin-Platzhalter:** [http://localhost:3000/admin](http://localhost:3000/admin)

### Inhalte (Platzhalter)

Öffentliche Seite und Legal-Seiten lesen **`SiteContent`** aus [`data/site-content.json`](./data/site-content.json) (validiert mit Zod, siehe [`lib/get-site-content.ts`](./lib/get-site-content.ts)). Texte und Bild-URLs können dort ersetzt werden; Schema gemäß [`content-model.md`](./content-model.md) und [`types/site-content.ts`](./types/site-content.ts).

Das **Hero-Bild** der Startseite liegt statisch unter [`public/images/hero.png`](./public/images/hero.png) (wird in [`components/sections/hero-section.tsx`](./components/sections/hero-section.tsx) eingebunden). Datei ersetzen, um das Motiv zu wechseln.

### Umgebungsvariablen

Vorlage: [`.env.example`](./.env.example) → bei Bedarf nach `.env.local` kopieren (Kontakt-API, Revalidate, sobald umgesetzt).

**Kontaktformular (Resend):** In **`.env.local`** und in **Netlify → Site configuration → Environment variables** (Scope **Production**, bei Bedarf auch Deploy Previews) mindestens `RESEND_API_KEY`, `RESEND_FROM_EMAIL` und **`CONTACT_TO_EMAIL`** setzen, sofern im Admin kein Feld **Formular-Empfänger** (`formRecipientEmail`) gepflegt ist. Zieladresse für Anfragen: **`Namaste@yomita.de`**. Domain **`yomita.de`** bei [Resend](https://resend.com) verifizieren; `RESEND_FROM_EMAIL` muss zur verifizierten Domain passen (z. B. `Kontakt <Namaste@yomita.de>`).

### Deployment / Domain (Live, Netlify)

Secrets aus einem früheren Vercel-Projekt **wandern nicht automatisch**; dieselben Namen und Werte in Netlify unter **Environment variables** neu anlegen (Production und ggf. Branch deploys / Deploy Previews). Checkliste (siehe auch [`.env.example`](./.env.example)):

| Variable | Zweck |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Kanonische URL `https://yomita.de` (ohne Slash am Ende). **Pflicht** für Live; ohne sie nutzt die App nur Netlify-Fallbacks, nicht eure Marketing-Domain. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL` | Kontaktformular |
| `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD_HASH` | Admin-Login |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis (Content) |
| `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN` | Nur **lokal** / optional in CI: Netlify [Personal Access Token](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli#obtain-a-token-in-the-netlify-ui) mit Blobs-Zugriff + Site-ID aus dem Dashboard. Auf **gehosteter** Netlify-Production sind Blobs ohne diese Variablen nutzbar. |
| `REVALIDATE_SECRET` | optional, falls On-Demand Revalidation genutzt wird |

**Medien (Netlify Blobs):** Uploads landen im Store `site-media`; Auslieferung über `/api/blob-image?key=…`. (Die einmalige Migration von Vercel Blob ist im Repo erledigt; es gibt kein Migrationsskript mehr.)

**Vercel-Projekt trennen:** Wenn die Site nur noch auf **Netlify** läuft und DNS auf Netlify zeigt, kannst du im Vercel-Dashboard die **Environment Variables** löschen, die **Git-Integration** zum Repo entfernen und das Projekt löschen oder archivieren. Vorher prüfen: keine anderen Dienste mehr an dieses Vercel-Projekt gebunden (z. B. separates Preview-Team, Analytics). Nach Löschen des Vercel-Blob-Stores wären alte `*.vercel-storage.com`-URLs tot — eure Live-Daten liegen in **Netlify Blobs** und in `data/site-content.json` bzw. KV.

Nach Änderungen an Umgebungsvariablen in Netlify einen **neuen Deploy** auslösen (z. B. „Clear cache and deploy site“), damit Canonicals, Sitemap, `robots.txt` und JSON-LD stimmen.

**Nach dem ersten erfolgreichen Deploy:** `/sitemap.xml`, `robots.txt` und eine Beispiel-Seite im Browser prüfen (Canonical-Link, `metadataBase`).

**DNS (IONOS):** Apex **`yomita.de`** zeigt auf Netlify (A/CNAME laut [Netlify Custom domains](https://docs.netlify.com/domains-https/custom-domains/)); **`www.yomita.de`** in Netlify als Domain hinzufügen und Redirect auf die Apex-URL einrichten.

**GitHub Actions:** Der Workflow [`.github/workflows/sync-yogaflow-courses.yml`](./.github/workflows/sync-yogaflow-courses.yml) nutzt **Repository Secrets** unter GitHub (nicht Netlify). Optional **`YOGAFLOW_APP_URL`** auf `https://yomita.de` oder die Netlify-Preview-URL setzen, falls zuvor eine `*.vercel.app`-Adresse verwendet wurde.

**Doppel-Deployments vermeiden:** Wenn das Repo noch an **Vercel** und **Netlify** hängt, löst jeder Push zwei Builds aus. Nach Cutover die Vercel-Git-Integration trennen oder das Vercel-Projekt archivieren.

**Build auf Netlify:** Im Repo liegt [`netlify.toml`](./netlify.toml) mit `@netlify/plugin-nextjs` und `npm run build:netlify` (`next build --webpack`), damit der Next-16-Output mit der Netlify-Runtime stabil zusammenspielt. Lokal reicht `npm run build`; für einen Netlify-parity-Build: `npm run build:netlify`. Optional `npx netlify-cli build --offline` — unter **Windows** mit Projekt-Pfaden, die **Leerzeichen** enthalten, kann die Edge-Bundling-Phase der CLI fehlschlagen; der **Deploy auf Netlify (Linux)** ist davon in der Regel nicht betroffen.

## Hinweis für neue Chat-Sessions (Cursor / KI)

Neue Chats haben **keinen** Zugriff auf frühere Unterhaltungen. Kontext über:

1. Diese `README.md` und die verlinkten Specs lesen.
2. Bei Implementierung: `project-brief.md`, `content-model.md`, `tech-decisions.md`, `docs/architecture.md` einbeziehen.
3. Projektregeln: `.cursor/rules/*.mdc`
