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
  formSuccessMessage?: string;
  formRecipientEmail?: string;
};

export type NavItem = {
  label: string;
  href: string;
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
  courses: Course[];
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
