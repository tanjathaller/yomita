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

export type BaseCourse = {
  id: string;
  title: string;
  description: string;
  /** e.g. weekday or a concrete date label */
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
};

export type Course = InternalCourse | ExternalCourse;

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
  image: {
    url: string;
    alt: string;
  };
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
  /** Anzeige „Datum“-Zeile (z. B. fester Wochentag). */
  day: string;
  time: string;
  location: string;
  price?: string;
  scheduleNote?: string;
};

export type GeneralSettings = {
  businessName: string;
  /** Wenn gesetzt: Anzeige im Header und im mobilen Menü-Titel (z. B. Kurzmarke). Sonst `businessName`. */
  navWordmark?: string;
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
  logoUrl?: string;
  siteTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
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
  /** Alt-Text für das Hero-Hintergrundbild (Barrierefreiheit & Bildsuche). */
  imageAlt: string;
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
  /** Body copy; Markdown if the section renderer supports it. */
  text: string;
  image: {
    url: string;
    alt: string;
  };
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
