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

## To Decide Later
- auth for admin
- image upload solution
- storage/database solution
- contact form backend
- cookie consent implementation