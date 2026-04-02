# Architektur – Next.js One-Pager + Admin

Abgestimmt mit `project-brief.md`, `content-model.md`, `tech-decisions.md` und `types/site-content.ts`.

## 1. App-Bereiche

| Bereich | Zweck |
|---------|--------|
| **Öffentlich** | One-Pager, SEO, wenig Client-JS. Rechtstexte als eigene Seiten. |
| **Admin** (`/admin`) | Pflege von `SiteContent` (Texte, Kurse, Preise, Settings, Legal). |
| **Shared** | `components/ui` (shadcn), Typen, Zod-Schemas, `lib/` (z. B. `getSiteContent`, Sortierung nach `sortOrder`). |

Empfehlung **Next.js App Router** mit **Route Groups**:

- `app/(public)/` – Landing, Impressum, Datenschutz  
- `app/(admin)/admin/…` – Dashboard (eigenes Layout, abgetrennte Navigation)  
- `app/api/…` – Kontakt, Revalidate, später ggf. geschützte Content-APIs  

## 2. Routing

### Öffentlich

- `/` – One-Pager: nach `#hero` folgt ein **Kurz-„Über mich“-Teaser** (ohne eigene Anker-ID, Link nach `#ueber-mich`); danach Anker wie in `content-model.md`: `#aktuelles` (optional), `#kurse`, `#preise`, `#ueber-mich`, `#kontakt`.
- `/impressum`, `/datenschutz` – Inhalt aus `legal.imprintText` / `legal.privacyText` (Markdown/HTML je nach Renderer).
- Metadata aus `settings`: `siteTitle`, `metaDescription`, `ogImageUrl`.

### Admin

- `/admin` – Haupt-Editor mit bereichsweisen Formularen (Tabs).
- `/admin/login` – Owner-Login.
- Datenmodell bleibt **ein** `SiteContent`; es werden nur Feldinhalte editiert, keine Sektionsstruktur.

### API (Beispiele)

- `POST /api/contact` – Kontaktformular (Backend laut `tech-decisions.md` noch offen: E-Mail-Service, etc.).
- `POST /api/revalidate` – On-Demand Revalidation nach Publish (geheimer Token/Header).
- Später: authentifizierte Routen oder ausschließlich **Server Actions** für Content-Updates.

### Route-Guard

- `/admin/*` (außer Login) ist über `proxy.ts` geschützt und prüft auf Session-Cookie.
- Serverseitige Prüfung erfolgt zusätzlich in den Admin-Actions/Page-Guards.

## 3. Datenfluss

1. **Single source of truth:** ein persistiertes `SiteContent` in Vercel KV (Key `site:content`), lokal mit Dateifallback (`data/site-content.json`).
2. **Kursliste (YogaFlow + manuell):** `getSiteContent()` hängt optional `yogaflowCourses` aus `data/yogaflow-courses.json` an (nicht-leeres `syncedAt`); **`courses`** im KV/JSON sind zusätzliche, manuell gepflegte Kurse (ohne App). Öffentliche UI: erste 4 YogaFlow-Termine mobil, 6 ab `lg`, Rest per „Mehr anzeigen“; manuelle Kurse eigener Block. Admin lädt `readSiteContent()` (ohne YogaFlow-Merge), damit der Entwurf keine Sync-Daten persistiert. Deaktivieren: `YOGAFLOW_USE_SYNCED_COURSES=false`. Sync: Workflow `sync-yogaflow-courses.yml` – Kursstammdaten Supabase REST, **Restplatz-Status** per **Playwright** aus der YogaFlow-Web-App (`YOGAFLOW_APP_URL` Secret), damit keine vollständige `registrations`-Lesbarkeit in Supabase nötig ist.
3. **Öffentliche Seiten:** Server Components laden Inhalt serverseitig (`getSiteContent()`), rendern Sektionen; Listen nach `sortOrder` sortieren.
4. **Caching:** `fetch` mit `revalidate` (ISR) oder On-Demand Revalidation nach Speichern im Admin (Vercel-tauglich).
5. **Admin:** Formulare pro Bereich; Speichern per **Server Action** (`siteContentSchema`), danach `revalidatePath` für öffentliche Routen.
6. **Kontakt:** POST → API → Versand/Weiterleitung; `contact.formRecipientEmail` optional, sonst Env.
7. **Medien:** vorerst URLs in Content (`aktuell.items[].image`, `about.image`, `logoUrl`, `ogImageUrl`); Upload-Lösung später ohne Änderung der Sektions-Architektur.

## 4. Wiederverwendbare Komponenten

| Schicht | Beispiele |
|---------|-----------|
| **shadcn** | Button, Input, Form, Card, Dialog (Legal), Sheet (Mobile-Nav). |
| **Layout** | `SiteHeader` (`fixed`, transparent; Nav-Pill `bg-[var(--surface-muted-band)]` wie Hero/`#kurse`), `main` mit `pt`: mobil `--site-header-clearance-mobile`, ab `lg` (1024px) `--site-header-clearance` und Desktop-Nav; `HeroSection` Karte auf `bg-[var(--surface-muted-band)]`; `SiteFooter` (Marke + Legal-Links). |
| **Sektionen** | `HeroSection`, `AboutTeaserSection` (Kurzportrait, Text vorerst fest im Code; an `about` angleichen), `AktuellesSection`, `CoursesSection`, `PricesSection`, `AboutSection`, `ContactSection` – Props = Teilbäume von `SiteContent`, außer Teaser. |
| **Domain** | `CourseCard` (intern/extern per `isExternalCourse` / `isInternalCourse`), `PriceCard`. |
| **Admin** | Formulare pro Bereich oder klar getrennte Unterseiten; gleiche Typen wie `SiteContent`. |

Keine Zahlungs- oder Buchungslogik in diesen Komponenten – App-Link und Kontaktformular genügen dem Brief.

## 5. Spätere Erweiterbarkeit

- **Auth-Härtung:** bestehendes Owner-Login + Session um Rate-Limit, 2FA oder Audit-Logs erweitern.
- **Kurs-Sync:** optional kürzeres Intervall, Webhook nach Buchung oder Edge-Funktion statt Cron.
- **Draft/Publish:** zweites Dokument oder Versionierung; öffentliche Route liest nur Published.
- **i18n:** optional `app/[locale]/` und lokalisierte Content-Struktur.
- **Weitere Marketing-Seiten:** unter `(public)`; Sektionen wiederverwenden.
- **Cookie Consent:** im Root-Layout oder nur öffentlich, wenn Umsetzung geklärt ist.

## 6. Abgleich Briefing (Kernfunktionen)

- Fester transparenter Header + Navigation  
- Hero mit primärem CTA zur App (`hero` + `settings.appUrl` / `primaryCtaUrl`)  
- Kurz-„Über mich“-Teaser unter dem Hero (Brücke zu `#ueber-mich`)  
- Aktuelles (optional, nur bei Einträgen) und Kurse mit Status und Fremd-Kurs-Links  
- Preise, Über mich, Kontaktformular  
- Admin-Dashboard zur Pflege  
- Deployment Vercel, Domain IONOS (Betrieb, nicht Code-Struktur)  

**Nicht implementieren** (siehe `project-brief.md`): Logo-Design als Leistung, Zahlungen auf der Site, Voll-Buchungssystem auf der Site, direkte App-Registrierung von der Webseite aus.
