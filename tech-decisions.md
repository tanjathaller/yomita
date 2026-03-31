# Tech Decisions

## Core Stack
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- GitHub
- Vercel

## App Structure
- Public website in the main app
- Admin dashboard under /admin

## UI Approach
- reusable sections
- component-based structure
- responsive, mobile-first

## Design
- Visual patterns and token roles: [`design-reference/design-system-profile.json`](design-reference/design-system-profile.json) (implement via shadcn/Tailwind, e.g. `globals.css` CSS variables).

## Content rendering (fest für diese Codebasis)
- `legal.imprintText` / `legal.privacyText` und Markdown in `about.text`: **react-markdown** (Komponente `MarkdownContent`). Kein rohes HTML aus dem JSON ohne weitere Absicherung.

## Admin/Auth/Persistenz (festgelegt)
- Owner-only Login unter `/admin/login` mit Session-Cookie.
- Route-Guard für `/admin/*` über `proxy.ts` (+ serverseitige Prüfung in Actions).
- `SiteContent` wird in Produktion in Vercel KV gespeichert (Key `site:content`), lokal mit Fallback auf `data/site-content.json`.

## To Decide Later
- image upload solution
- contact form backend
- cookie consent implementation