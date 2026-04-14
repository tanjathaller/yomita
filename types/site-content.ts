/**
 * Canonical types for the yoga one-pager + admin content.
 * Spec: ../content-model.md
 */

/** DOM / URL anchors for one-page sections (kebab-case in href). */
export type SectionId =
  | "hero"
  | "aktuell"
  | "courses"
  | "prices"
  | "about"
  | "contact";

export type BookingStatus = "available" | "full";

/**
 * Optionaler Link auf der Status-Pill unter dem Kartentitel.
 * Standard: nicht verlinkt (`enabled` aus oder fehlt).
 */
export type BookingBadgeLink = {
  enabled?: boolean;
  /** Pflicht, wenn `enabled` true (Speichern validiert). */
  kind?: "url" | "anchor";
  /** Bei `kind: "url"`: vollständige http(s)-URL. */
  url?: string;
  /** Bei `kind: "anchor"`: DOM-Fragment ohne führendes # (z. B. `kontakt` → `/#kontakt`). */
  anchor?: string;
};

export type BaseCourse = {
  id: string;
  title: string;
  description: string;
  /** Wochentag oder konkretes Datum (Label auf der Karte: „Wochentag“). */
  day: string;
  time: string;
  location: string;
  bookingStatus: BookingStatus;
  /** Anzeige z. B. „12 €“ (optional; YogaFlow-Sync). */
  price?: string;
  /**
   * Freie Plätze aus YogaFlow-Sync. Wenn gesetzt, steuert `CourseStatusBadge` die Texte
   * (Restplatz / Verfügbar / ausgebucht); sonst Fallback über `bookingStatus`.
   */
  remainingSpots?: number;
  /**
   * Optionaler fester Pill-Text statt „Plätze frei“/Sync-Status (z. B. manuelle Kurse
   * ohne App-Restplätze).
   */
  bookingBadgeLabel?: string;
  /** Pill als Link (URL oder Anker); nur wirksam wenn `enabled` gesetzt ist. */
  bookingBadgeLink?: BookingBadgeLink;
  /** Lower values appear first in lists. */
  sortOrder: number;
};

export type InternalCourse = BaseCourse & {
  type: "internal";
  startsOn?: string;
  endsOn?: string;
  scheduleNote?: string;
};

export type ExternalCourse = BaseCourse & {
  type: "external";
  externalUrl: string;
  /**
   * Text des Link-Buttons unter der Kursbeschreibung.
   * Leer oder fehlend → öffentliche Seite zeigt „Zur Anbieter-Seite“.
   */
  externalLinkLabel?: string;
};

export type Course = InternalCourse | ExternalCourse;

/**
 * Bild mit getrennten URLs für Mobil (&lt; lg) und Desktop (≥ lg); ein gemeinsamer Alt-Text.
 */
export type SiteResponsiveImage = {
  alt: string;
  mobile: { url: string };
  desktop: { url: string };
};

/** Nur URL-Paare (z. B. Logo, OG), ohne Alt-Text. */
export type SiteResponsiveImageUrls = {
  mobile: { url: string };
  desktop: { url: string };
};

export type PriceItem = {
  id: string;
  title: string;
  /** Info- / Preislabel: Kurztext in der Pill; bei Link auch Button-Text (leer → „Mehr erfahren“). */
  price: string;
  /** Fließtext unter dem Kopfbereich (Markdown). */
  description: string;
  linkUrl?: string;
  sortOrder: number;
  highlighted?: boolean;
};

export type AboutSection = {
  /** Sektionsüberschrift (Desktop in der Textkarte; Mobil groß am Portrait). Zeilenumbruch optional: zwei Zeilen. */
  title: string;
  /** Kleines Label über der Überschrift, nur Desktop („Eyebrow“). */
  eyebrow?: string;
  text: string;
  image: SiteResponsiveImage;
};

export type ContactSection = {
  email: string;
  phone: string;
  formHeadline: string;
  formText: string;
  /** Beschriftung des Absende-Buttons im Kontaktformular. */
  formSubmitLabel: string;
  formSuccessMessage?: string;
  formRecipientEmail?: string;
};

export type NavItem = {
  label: string;
  href: string;
};

/**
 * Steuert eine Karten-Serie für aus der YogaFlow-Sync-Datei kommende Termine:
 * feste Anzeige auf der Karte, Zuordnung über exakte App-Kurstitel (`matchTitles`).
 */
export type YogaflowCourseSeries = {
  id: string;
  /** Reihenfolge der Karten (niedrig zuerst). */
  sortOrder: number;
  /**
   * Exakte(r) `title` aus der Synchronisation (z. B. „Yoga am Dienstag“).
   * Alle passenden Termine erscheinen in der aufklappbaren Liste.
   */
  matchTitles: string[];
  /** Öffentlicher Kartentitel. */
  displayTitle: string;
  /** Kurzbeschreibung / Kursstil auf der Karte. */
  description: string;
  /** Anzeige in der „Wochentag“-Zeile auf der Karte. */
  day: string;
  time: string;
  location: string;
  price?: string;
  scheduleNote?: string;
  /** Pill unter dem Titel (z. B. „Buchung über die App“). */
  bookingBadgeLabel?: string;
  bookingBadgeLink?: BookingBadgeLink;
};

export type GeneralSettings = {
  businessName: string;
  /** Wenn gesetzt: Anzeige im Header und im mobilen Menü-Titel (z. B. Kurzmarke). Sonst `businessName`. */
  navWordmark?: string;
  /** Steuert die Logo-Anzeige in der Navigation; fehlend entspricht `true`. */
  logoEnabled?: boolean;
  /** Steuert die Wordmark-Anzeige in der Navigation; fehlend entspricht `true`. */
  wordmarkEnabled?: boolean;
  /** Steuert die kleine Hero-Kopfzeile; fehlend entspricht `true`. */
  heroEyebrowEnabled?: boolean;
  /** Steuert das Aktuelles-Label ueber der Section-Headline; fehlend entspricht `true`. */
  aktuellEyebrowEnabled?: boolean;
  /** Steuert das Kurse-Label ueber der Section-Headline; fehlend entspricht `true`. */
  coursesEyebrowEnabled?: boolean;
  /** Steuert das Preise-Label ueber der Section-Headline; fehlend entspricht `true`. */
  pricesEyebrowEnabled?: boolean;
  /** Optionale kleine Labels oberhalb von Sektions-Headlines. */
  sectionEyebrows?: {
    /** Hero-Eyebrow; Fallback ist `businessName`. */
    hero?: string;
    /** Label über der Aktuelles-Headline (z. B. „Journal“). */
    aktuell?: string;
    /** Label über der Kurse-Headline (z. B. „Angebot“). */
    courses?: string;
    /** Label über der Preise-Headline (z. B. „Teilnahme“). */
    prices?: string;
  };
  /** Optionaler Titel der Kurse-Sektion (Fallback: „Kurse & Termine“). */
  coursesSectionTitle?: string;
  /** Optionaler Untertext der Kurse-Sektion (Markdown; Fallback: Standardtext inkl. Link zu `#kontakt`). */
  coursesSectionIntro?: string;
  /**
   * @deprecated Wird nicht mehr angezeigt (Kurse & Termine: eine gemeinsame Liste).
   * Beim Parsen erhalten; optional aus Admin entfernt.
   */
  coursesManualSectionTitle?: string;
  /** Karten für App-Serien (Vinyasa Dienstag, Flow Mittwoch, …); Termine kommen aus `yogaflowCourses`. */
  yogaflowCourseSeries?: YogaflowCourseSeries[];
  /** Optionaler Titel der Preise-Sektion (Fallback: „Preise“). */
  pricesSectionTitle?: string;
  /** Optionaler Untertext der Preise-Sektion (Markdown; Fallback: Hinweis zu Zahlung/Abwicklung). */
  pricesSectionIntro?: string;
  appUrl: string;
  /** Optionales Logo; Mobil- und Desktop-Datei getrennt (z. B. Zuschnitt/Auflösung). */
  logo?: SiteResponsiveImageUrls;
  siteTitle?: string;
  metaDescription?: string;
  /** Open-Graph-Vorschau; für Metadaten wird primär die Desktop-URL genutzt. */
  ogImage?: SiteResponsiveImageUrls;
  navigation?: NavItem[];
};

export type LegalContent = {
  /** Markdown or HTML — align with your renderer. */
  imprintText: string;
  /** Markdown or HTML — align with your renderer. */
  privacyText: string;
};

export type HeroSection = {
  title: string;
  claim: string;
  /** Hintergrundbild; Mobil und Desktop als separate Dateien. */
  backgroundImage: SiteResponsiveImage;
  primaryCtaLabel: string;
  /** Often `settings.appUrl` with optional query params. */
  primaryCtaUrl: string;
};

export type AktuellesItem = {
  id: string;
  /** Optional short headline for the topic (e.g. workshop title). */
  title?: string;
  /**
   * Text im Bild-Badge (oben links auf der Karte). Wenn leer: automatisch
   * „Workshop“, wenn der Titel „workshop“ enthält, sonst „Aktuell“.
   */
  badgeLabel?: string;
  /** Steuert das Bild-Badge pro Karte; fehlend entspricht `true`. */
  badgeEnabled?: boolean;
  /** Body copy; Markdown if the section renderer supports it. */
  text: string;
  image: SiteResponsiveImage;
  /** Optional card CTA button; disabled by default. */
  cta?: {
    enabled?: boolean;
    label?: string;
    href?: string;
  };
  /** Lower values appear first in lists. */
  sortOrder: number;
};

export type AktuellesSection = {
  /** Section heading; UI default is „Aktuelles“ if empty. */
  title?: string;
  /** Optional intro below the heading (Markdown if supported). */
  intro?: string;
  items: AktuellesItem[];
};

/** Full public page payload (single document / API response). */
export type SiteContent = {
  hero: HeroSection;
  aktuell: AktuellesSection;
  /** Manuell im Content (KV/JSON) gepflegte Kurse – nicht aus der YogaFlow-Sync-Datei. */
  courses: Course[];
  /**
   * Nur zur Laufzeit auf der öffentlichen Seite: Kurse aus `data/yogaflow-courses.json`.
   * Wird nicht mit dem Admin in KV persistiert.
   */
  yogaflowCourses?: Course[];
  prices: PriceItem[];
  about: AboutSection;
  contact: ContactSection;
  settings: GeneralSettings;
  legal: LegalContent;
};

export function isExternalCourse(course: Course): course is ExternalCourse {
  return course.type === "external";
}

export function isInternalCourse(course: Course): course is InternalCourse {
  return course.type === "internal";
}
