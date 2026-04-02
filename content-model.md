# Content Model – Yoga Webseite Tanja

Zentrale Spezifikation für alle öffentlich darstellbaren Inhalte der One-Pager-Seite und für das Admin-Dashboard. **Canonical types:** siehe `types/site-content.ts` (TypeScript).

---

## One-Pager: Sektionen & Anker-IDs

Die Navigation verweist auf Anker innerhalb einer Seite. Empfohlene `id`-Attribute am DOM (kebab-case):

| `SectionId` | Anker (`href`)   | Inhalt                    |
|-------------|------------------|---------------------------|
| `hero`      | `#hero`          | Hero                      |
| —           | —                | Kurz-„Über mich“-Teaser (nur UI, direkt unter dem Hero; **kein** eigener Anker, Link nach `#ueber-mich`) |
| `aktuell`   | `#aktuelles`     | Aktuelles (Themen mit Bild + Text) |
| `courses`   | `#kurse`         | Kurs- und Terminübersicht |
| `prices`    | `#preise`        | Preisübersicht            |
| `about`     | `#ueber-mich`    | Über mich                 |
| `contact`   | `#kontakt`       | Kontakt + Formular        |

Rechtstexte (Impressum/Datenschutz) können als eigene Routen (`/impressum`, `/datenschutz`) oder als Modal/Overlay angebunden werden – der Inhalt kommt aus **Legal**.

---

## Navigation (`settings.navigation`)

Optional. Wenn leer oder nicht gesetzt, kann die UI Default-Einträge aus der Tabelle oben ableiten.

| Feld    | Typ    | Beschreibung                          |
|---------|--------|---------------------------------------|
| `label` | string | Anzeigetext (z. B. „Kurse“)           |
| `href`  | string | Ziel, z. B. `#kurse` oder `/#kurse`   |

**Sticky Header:** dieselben Einträge für die Hauptnavigation verwenden.

---

## Hero

| Feld               | Typ    | Beschreibung |
|--------------------|--------|--------------|
| `title`            | string | Hauptüberschrift |
| `claim`            | string | Unterzeile / Value Proposition |
| `primaryCtaLabel`  | string | Button-Text zum App-Einstieg |
| `primaryCtaUrl`    | string | Link-Ziel; meist `settings.appUrl`, ggf. mit UTM-Parametern |

**UI:** Über der Headline kann `settings.sectionEyebrows.hero` als kleine Eyebrow-Zeile erscheinen; Fallback ist `settings.businessName` (optional, nur Darstellung; Text bleibt direkt auf dem Hero-Foto mit Schatten für Lesbarkeit).

---

## Kurz-„Über mich“-Teaser (nur öffentliche UI)

Zwischen **Hero** und **Aktuelles** (bzw. – wenn `aktuell.items` leer ist – direkt vor **Kurse**) rendert die Seite einen **sehr kurzen Mini-Teaser** ohne zweites Portraitfoto: äußeres Band wie nach der Hero-Wellenkante (`--surface-muted-band`), **innere Karte** im Hero-Rahmen-Stil mit leicht **warmem Verlauf**, persönliche Eyebrow-Zeile, kurze **Headline**, **ein knapper Absatz** (Verweis auf den ausführlichen Block), sekundärer Button **„Mehr über mich“** → `/#ueber-mich` (ab `md` zweispaltig: links Titel + CTA, rechts Text). **Welle unten:** Wenn **Aktuelles** sichtbar ist, geht die Kurve wie bei **Kurse → Preise** in die Seitenfläche (`--background`); **Aktuelles** liegt dann auf derselben hellen Fläche wie **Preise**. Ohne Aktuelles bleibt die Welle im **Muted-Band** vor **Kurse**.

| Aspekt | Festlegung |
|--------|------------|
| Datenquelle | **Aktuell nicht** Teil von `SiteContent`; Text in `components/sections/about-teaser-section.tsx`. |
| Inhalt | Soll mit dem Fließtext in **`about.text`** (und dem Portrait in **`about.image`**) inhaltlich zusammenpassen – bei Umstellungen im JSON Teaser manuell mitziehen. |
| Admin | Später optional eigene Felder (z. B. `about.teaser`); bis dahin: Änderungen in der Komponente. |
| Anker / Nav | Keine eigene `id`, kein Eintrag in der Standard-Navigation. |

---

## Aktuelles (`aktuell`)

Kurzmeldungen, Saison-Hinweise oder Einzelthemen **oberhalb** der Kursübersicht (und **unter** dem Kurz-„Über mich“-Teaser, sofern dieser angezeigt wird). Direkt unter dem Teaser (wenn beide Sektionen sichtbar) liegt die Sektion auf **`bg-background`** (helle Fläche) mit Wellenübergang **nach unten** zurück ins **Muted-Band** vor **Kurse**. Liegt die Liste `items` leer, rendert die öffentliche Seite die Sektion nicht; die **Standard-Navigation** blendet den Eintrag „Aktuelles“ dann ebenfalls aus (eigene `settings.navigation` bleibt unverändert).

### Sektion

| Feld    | Typ      | Beschreibung |
|---------|----------|--------------|
| `title` | string?  | Überschrift; UI-Fallback: „Aktuelles“ |
| `intro` | string?  | optionaler Einleitungstext (Markdown, je nach Renderer) |
| `items` | Array    | siehe unten |

### Eintrag (`aktuell.items[]`)

| Feld        | Typ     | Beschreibung |
|-------------|---------|--------------|
| `id`        | string  | stabile ID |
| `title`     | string? | optional: kurzer Thementitel |
| `badgeLabel` | string? | optional: Text des kleinen Badges auf dem Kartenbild; wenn leer: automatisch „Workshop“, wenn der Titel „workshop“ enthält (Groß-/Kleinschreibung egal), sonst „Aktuell“ |
| `text`      | string  | Fließtext (Markdown möglich, je nach Renderer) |
| `cta`       | object? | optionaler Link-Button pro Card (standardmäßig deaktiviert) |
| `sortOrder` | number  | Reihenfolge (niedrig = weiter oben) |

### Optionaler Card-Button (`items[].cta`)

| Feld      | Typ      | Beschreibung |
|-----------|----------|--------------|
| `enabled` | boolean? | Button ein-/ausblenden (Default: aus) |
| `label`   | string?  | Button-Beschriftung (Pflicht, wenn `enabled=true`) |
| `href`    | string?  | Button-Link (Pflicht, wenn `enabled=true`; erlaubt: `https://`, `http://`, `mailto:`, `#anker`, `/pfad`) |

### Bild (`items[].image`)

| Feld  | Typ    | Beschreibung |
|-------|--------|--------------|
| `url` | string | Bild-URL (Upload/CDN) |
| `alt` | string | Pflicht für Barrierefreiheit |

---

## Kurse (`courses[]`)

Jeder Eintrag ist entweder **intern** (eigene Kurse / App) oder **extern** (Fremdkurse). **`externalUrl` darf nur bei `type: "external"` vorkommen** – technisch als Diskriminated Union umsetzen (siehe TypeScript).

### Gemeinsame Felder (`BaseCourse`)

| Feld              | Typ     | Beschreibung |
|-------------------|---------|--------------|
| `id`              | string  | stabile ID (UUID oder Slug) |
| `title`           | string  | Kursname |
| `description`     | string  | Kurzbeschreibung |
| `day`             | string  | z. B. Wochentag oder „Sa., 15.03.“ |
| `time`            | string  | z. B. „18:00–19:30“ |
| `location`        | string  | Ort / Studio |
| `bookingStatus`   | enum    | `available` \| `full` |
| `sortOrder`       | number  | Sortierung im Dashboard (niedrig = weiter oben) |

### Interner Kurs (`type: "internal"`)

Zusätzlich optional, für Workshops oder klare Zeiträume:

| Feld           | Typ     | Beschreibung |
|----------------|---------|--------------|
| `startsOn`     | string? | ISO-Datum (Start) |
| `endsOn`       | string? | ISO-Datum (Ende), z. B. Kursblock |
| `scheduleNote` | string? | Freitext, z. B. „wöchentlich“, „nur im März“ |

Kein Feld `externalUrl`.

### Externer Kurs (`type: "external"`)

| Feld           | Typ    | Beschreibung |
|----------------|--------|--------------|
| `externalUrl`  | string | Pflicht; Link zur Anbieter-Seite o. Ä. |

---

## Preise (`prices[]`)

| Feld           | Typ      | Beschreibung |
|----------------|----------|--------------|
| `id`           | string   | stabile ID |
| `title`        | string   | z. B. „10er-Karte“ |
| `price`        | string   | **Info- / Preislabel** in der Pill unter dem Titel; bei gesetztem `linkUrl` erscheint derselbe Text auf dem Link-Button (leer → „Mehr erfahren“) |
| `description`  | string   | Erläuterung (**Markdown**) |
| `linkUrl`      | string?  | optionaler externer Link (z. B. Anbieter-Seite) |
| `sortOrder`    | number   | Reihenfolge |
| `highlighted`  | boolean? | optional hervorgehobene Karte in der UI |

---

## Über mich (`about`)

| Feld    | Typ    | Beschreibung |
|---------|--------|--------------|
| `title` | string | Sektionsüberschrift |
| `text`  | string | Fließtext (Markdown möglich, je nach Renderer) |

### Bild (`about.image`)

| Feld  | Typ    | Beschreibung |
|-------|--------|--------------|
| `url` | string | Bild-URL (Upload/CDN) |
| `alt` | string | Pflicht für Barrierefreiheit |

---

## Kontakt (`contact`)

| Feld                   | Typ      | Beschreibung |
|------------------------|----------|--------------|
| `email`                | string   | Öffentliche Kontakt-E-Mail (Anzeige) |
| `phone`                | string   | Telefon (Anzeige) |
| `formHeadline`         | string   | Überschrift über dem Formular |
| `formText`             | string   | Einleitung / Hinweise zum Formular |
| `formSuccessMessage`   | string?  | Text nach erfolgreichem Absenden |
| `formRecipientEmail`   | string?  | optional: Ziel-E-Mail für Submissions; wenn leer, Fallback über Server-Config/Env |

---

## Allgemeine Einstellungen (`settings`)

| Feld               | Typ      | Beschreibung |
|--------------------|----------|--------------|
| `businessName`     | string   | u. a. Hero-Eyebrow, Metadaten-Template; Footer-Wordmark nur wenn `navWordmark` fehlt |
| `navWordmark`      | string?  | optional; wenn gesetzt: Wordmark in **Header**, **Mobile-Menü** und **Footer** (z. B. „YOMITA“) |
| `sectionEyebrows`  | object?  | optionale kleine Labels über Abschnitts-Headlines: `hero`, `aktuell`, `courses`, `prices`; Fallbacks: `businessName` bzw. „Journal“, „Angebot“, „Teilnahme“ |
| `coursesSectionTitle` | string? | optionaler Titel der Kurse-Sektion; Fallback: „Kurse & Termine“ |
| `coursesSectionIntro` | string? | optionaler Untertext der Kurse-Sektion (**Markdown**); z. B. Link zum Kontakt `[Kontaktformular](/#kontakt)`; Fallback: Standardtext mit diesem Link |
| `pricesSectionTitle` | string? | optionaler Titel der Preise-Sektion; Fallback: „Preise“ |
| `pricesSectionIntro` | string? | optionaler Untertext der Preise-Sektion (**Markdown**); Fallback: Hinweis zu Zahlung/Abwicklung außerhalb der Website |
| `appUrl`           | string   | Hauptlink zur Kursbuchungs-App (Hero-CTA kann davon abweichen, z. B. Tracking) |
| `logoUrl`          | string?  | optional; Logo-Erstellung ist nicht Projektbestandteil, Upload-URL ist erlaubt |
| `siteTitle`        | string?  | `<title>` / Branding |
| `metaDescription`  | string?  | Meta-Description SEO |
| `ogImageUrl`       | string?  | Open-Graph-Vorschaubild |
| `navigation`       | siehe oben | optionale Nav-Einträge |

---

## Rechtliches (`legal`)

Inhalt als **Markdown oder HTML** speichern – je nach dem, was der Renderer im Frontend/Admin unterstützt (einheitlich festlegen).

| Feld           | Typ    | Beschreibung |
|----------------|--------|--------------|
| `imprintText`  | string | Impressum |
| `privacyText`  | string | Datenschutz |

Strukturierte Einzelfelder (Name, Adresse, …) sind **nicht** vorgeschrieben; bei Bedarf später ergänzen.

---

## Gesamtobjekt `SiteContent`

Ein Dokument (JSON, CMS-Record, eine Zeile), das die gesamte Seite speist:

- `hero` → Hero  
- *(UI)* → Kurz-„Über mich“-Teaser (nicht im JSON)  
- `aktuell` → Aktuelles (`items` sortiert nach `sortOrder`)  
- `courses` → `Course[]`  
- `prices` → `PriceItem[]`  
- `about` → About  
- `contact` → Contact  
- `settings` → GeneralSettings  
- `legal` → LegalContent  

---

## Hinweise für Admin & Implementierung

- **Sortierung:** `sortOrder` bei Aktuelles-Einträgen, Kursen und Preisen im Dashboard pflegen; öffentliche Liste danach sortieren.  
- **Listen-Limit:** In `aktuell.items`, `courses` und `prices` sind maximal **10** Cards erlaubt.  
- **Validierung:** Bei `type: "internal"` kein `externalUrl`; bei `type: "external"` muss `externalUrl` gesetzt sein.  
- **Struktur-Schutz:** Sektionen, Reihenfolge und Layout-Templates bleiben fest; im Admin sind nur Inhalte/Felder innerhalb von `SiteContent` editierbar.  
- **Brief:** Keine Zahlungsabwicklung, kein Buchungssystem auf der Webseite, keine App-Neuregistrierung – das Content-Model spiegelt das wider (App nur per Link, Kontakt per Formular).  
- **Logo:** optional per URL; keine verpflichtende Logo-Produktion im Projekt.
