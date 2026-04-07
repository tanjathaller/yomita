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
- **GitHub**, **Vercel** (Deployment), Domain **IONOS**

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

### Deployment / Domain (Live)

- **Kanonische URL:** `https://yomita.de` (Apex, ohne `www`). `www.yomita.de` per Redirect auf die Apex-URL ausrichten (DNS bei IONOS auf Vercel; in Vercel Domains und ggf. Redirect prüfen).
- **`NEXT_PUBLIC_SITE_URL`:** `https://yomita.de` (ohne trailing slash) in **`.env.local`** und in **Vercel → Project → Settings → Environment Variables** für **Production** setzen. Nach Änderungen einen **Redeploy** auslösen, damit Canonicals, Sitemap, `robots.txt` und JSON-LD die richtige Domain nutzen.
- Ohne diese Variable fällt die App auf die automatische **`VERCEL_URL`** (`*.vercel.app`) zurück — für das Live-Mapping auf `yomita.de` ist die Variable Pflicht.

## Hinweis für neue Chat-Sessions (Cursor / KI)

Neue Chats haben **keinen** Zugriff auf frühere Unterhaltungen. Kontext über:

1. Diese `README.md` und die verlinkten Specs lesen.
2. Bei Implementierung: `project-brief.md`, `content-model.md`, `tech-decisions.md`, `docs/architecture.md` einbeziehen.
3. Projektregeln: `.cursor/rules/*.mdc`
