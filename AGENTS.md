# Hinweise für Agenten (Cursor, KI)

## Pflichtlektüre bei Feature- oder Architekturarbeit

1. `project-brief.md` – Ziele und **Nicht-Ziele** (keine Zahlungen, kein Buchungssystem auf der Site, keine App-Neuregistrierung auf der Site, keine Logo-**Entwicklung** als Projektaufgabe).
2. `content-model.md` – Inhaltsstruktur, Anker-IDs, Kurs-Typen **internal vs. external**.
3. `types/site-content.ts` – **Canonical types**; bei API/Admin dieselben Strukturen verwenden.
4. `tech-decisions.md` – Stack; offene Punkte nicht einfach „wegentscheiden“, sondern dokumentieren oder Rückfrage.
5. `docs/architecture.md` – Routing, Datenfluss, Komponentenschichten.

## Verhalten

- **Sprache:** Wenn der Nutzer auf Deutsch schreibt, **auf Deutsch** antworten (klar, strukturiert).
- **Scope:** Nur das umsetzen, was angefragt ist; keine großen Refactorings nebenbei.
- **Kurse:** `externalUrl` nur bei `type: "external"`; Validierung und Typen konsistent halten.
- **Content:** Ein Dokument `SiteContent` als Quelle für die öffentliche Seite; Admin schreibt dieselbe Form (siehe `content-model.md`). **Ausnahme:** der Kurz-„Über mich“-Teaser unter dem Hero liegt vorerst fest in `AboutTeaserSection` – bei Änderungen an `about.text` Teaser-Text mitabgleichen.

## Wo Cursor-Regeln liegen

`.cursor/rules/*.mdc` – ergänzen diese Datei; bei Widerspruch haben **explizite Spec-Dateien im Repo** Vorrang (Regeln dann anpassen).
