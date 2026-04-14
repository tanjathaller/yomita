import { z } from "zod";

const bookingStatusSchema = z.enum(["available", "full"]);

const bookingBadgeLinkSchema = z
  .object({
    enabled: z.boolean().optional(),
    kind: z.enum(["url", "anchor"]).optional(),
    url: z.string().optional(),
    anchor: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) {
      return;
    }
    if (value.kind !== "url" && value.kind !== "anchor") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kind"],
        message: "Bitte Link-Art wählen (URL oder Anker).",
      });
      return;
    }
    if (value.kind === "url") {
      const u = value.url?.trim() ?? "";
      if (!u) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: "Bitte eine URL eintragen.",
        });
        return;
      }
      if (!/^https?:\/\/\S+$/i.test(u)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: "URL muss mit https:// oder http:// beginnen.",
        });
      }
      return;
    }
    const a = (value.anchor ?? "").trim().replace(/^#/, "");
    if (!a) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anchor"],
        message: "Bitte einen Anker wählen oder eintragen.",
      });
      return;
    }
    if (!/^[a-z0-9-]+$/i.test(a)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anchor"],
        message: "Ungültiger Anker (nur Buchstaben, Ziffern, Bindestrich).",
      });
    }
  });

const baseCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  day: z.string(),
  time: z.string(),
  location: z.string(),
  bookingStatus: bookingStatusSchema,
  price: z.string().optional(),
  remainingSpots: z.number().int().min(0).optional(),
  bookingBadgeLabel: z.string().min(1).optional(),
  bookingBadgeLink: bookingBadgeLinkSchema.optional(),
  sortOrder: z.number(),
});

const internalCourseSchema = baseCourseSchema.extend({
  type: z.literal("internal"),
  startsOn: z.string().optional(),
  endsOn: z.string().optional(),
  scheduleNote: z.string().optional(),
});

const externalCourseSchema = baseCourseSchema.extend({
  type: z.literal("external"),
  externalUrl: z.string().min(1),
  externalLinkLabel: z.string().min(1).optional(),
});

export const courseSchema = z.discriminatedUnion("type", [
  internalCourseSchema,
  externalCourseSchema,
]);

export const priceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.string(),
  description: z.string(),
  linkUrl: z.string().min(1).optional(),
  sortOrder: z.number(),
  highlighted: z.boolean().optional(),
});

const legacyFlatImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
});

const responsiveImageInputSchema = z.union([
  z.object({
    alt: z.string(),
    mobile: z.object({ url: z.string() }),
    desktop: z.object({ url: z.string() }),
  }),
  legacyFlatImageSchema,
]);

/** About, Aktuelles: Alt + Mobil-/Desktop-URL; Legacy `{ url, alt }` wird beim Parsen verdoppelt. */
export const siteResponsiveImageSchema = responsiveImageInputSchema
  .transform((raw) => {
    if ("mobile" in raw) {
      return {
        alt: raw.alt.trim(),
        mobile: { url: raw.mobile.url.trim() },
        desktop: { url: raw.desktop.url.trim() },
      };
    }
    const u = raw.url.trim();
    return {
      alt: raw.alt.trim(),
      mobile: { url: u },
      desktop: { url: u },
    };
  })
  .pipe(
    z.object({
      alt: z.string().min(1),
      mobile: z.object({ url: z.string().min(1) }),
      desktop: z.object({ url: z.string().min(1) }),
    }),
  );

export const aboutSectionSchema = z.object({
  title: z.string(),
  eyebrow: z.string().optional(),
  text: z.string(),
  image: siteResponsiveImageSchema,
});

export const contactSectionSchema = z.object({
  email: z.string(),
  phone: z.string(),
  formHeadline: z.string(),
  formText: z.string(),
  formSubmitLabel: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : "Unverbindlich anfragen")),
  formSuccessMessage: z.string().optional(),
  formRecipientEmail: z.string().optional(),
});

export const navItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const yogaflowCourseSeriesSchema = z.object({
  id: z.string().min(1),
  sortOrder: z.number(),
  matchTitles: z.array(z.string().min(1)).min(1),
  displayTitle: z.string().min(1),
  description: z.string(),
  day: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  price: z.string().optional(),
  scheduleNote: z.string().optional(),
  bookingBadgeLabel: z.string().min(1).optional(),
  bookingBadgeLink: bookingBadgeLinkSchema.optional(),
});

const optionalUrlPairSchema = z
  .object({
    mobile: z.object({ url: z.string() }),
    desktop: z.object({ url: z.string() }),
  })
  .optional();

function normalizeOptionalUrlPair(
  pair: { mobile: { url: string }; desktop: { url: string } } | undefined,
  legacySingle: string | undefined,
): { mobile: { url: string }; desktop: { url: string } } | undefined {
  const hasPair =
    pair &&
    (pair.mobile.url.trim().length > 0 || pair.desktop.url.trim().length > 0);
  if (hasPair) {
    const m = pair.mobile.url.trim() || pair.desktop.url.trim();
    const d = pair.desktop.url.trim() || pair.mobile.url.trim();
    return { mobile: { url: m }, desktop: { url: d } };
  }
  const legacy = legacySingle?.trim();
  if (legacy) {
    return { mobile: { url: legacy }, desktop: { url: legacy } };
  }
  return undefined;
}

export const generalSettingsSchema = z
  .object({
    businessName: z.string(),
    navWordmark: z.string().optional(),
    logoEnabled: z.boolean().optional(),
    wordmarkEnabled: z.boolean().optional(),
    heroEyebrowEnabled: z.boolean().optional(),
    aktuellEyebrowEnabled: z.boolean().optional(),
    coursesEyebrowEnabled: z.boolean().optional(),
    pricesEyebrowEnabled: z.boolean().optional(),
    sectionEyebrows: z
      .object({
        hero: z.string().optional(),
        aktuell: z.string().optional(),
        courses: z.string().optional(),
        prices: z.string().optional(),
      })
      .optional(),
    coursesSectionTitle: z.string().optional(),
    coursesSectionIntro: z.string().optional(),
    coursesManualSectionTitle: z.string().optional(),
    yogaflowCourseSeries: z.array(yogaflowCourseSeriesSchema).max(10).optional(),
    pricesSectionTitle: z.string().optional(),
    pricesSectionIntro: z.string().optional(),
    appUrl: z.string().min(1),
    /** @deprecated Nur für alte JSON-Daten; wird zu `logo` zusammengeführt. */
    logoUrl: z.string().optional(),
    logo: optionalUrlPairSchema,
    siteTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    /** @deprecated Nur für alte JSON-Daten; wird zu `ogImage` zusammengeführt. */
    ogImageUrl: z.string().optional(),
    ogImage: optionalUrlPairSchema,
    navigation: z.array(navItemSchema).optional(),
  })
  .superRefine((settings, ctx) => {
    const logoEnabled = settings.logoEnabled !== false;
    const wordmarkEnabled = settings.wordmarkEnabled !== false;
    if (!logoEnabled && !wordmarkEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["logoEnabled"],
        message: "Mindestens Logo oder Nav Wordmark muss aktiviert sein.",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wordmarkEnabled"],
        message: "Mindestens Logo oder Nav Wordmark muss aktiviert sein.",
      });
    }
  })
  .transform((s) => {
    const { logoUrl, ogImageUrl, logo, ogImage, ...rest } = s;
    return {
      ...rest,
      logo: normalizeOptionalUrlPair(logo, logoUrl),
      ogImage: normalizeOptionalUrlPair(ogImage, ogImageUrl),
    };
  });

export const legalContentSchema = z.object({
  imprintText: z.string(),
  privacyText: z.string(),
});

const heroImageAltDefault = "Portrait – Yogastudio und Achtsamkeit";
const DEFAULT_HERO_BACKGROUND = "/images/tanja-10-mobile.webp";

export const heroSectionSchema = z
  .object({
    title: z.string(),
    claim: z.string(),
    /** @deprecated Wird zu `backgroundImage.alt` zusammengeführt, wenn kein neues Objekt gesetzt ist. */
    imageAlt: z.string().optional(),
    primaryCtaLabel: z.string(),
    primaryCtaUrl: z.string().min(1),
    backgroundImage: responsiveImageInputSchema.optional(),
  })
  .transform((h) => {
    const rawBi = h.backgroundImage;
    const bi = rawBi
      ? "mobile" in rawBi
        ? {
            alt: rawBi.alt.trim(),
            mobile: { url: rawBi.mobile.url.trim() },
            desktop: { url: rawBi.desktop.url.trim() },
          }
        : {
            alt: rawBi.alt.trim(),
            mobile: { url: rawBi.url.trim() },
            desktop: { url: rawBi.url.trim() },
          }
      : undefined;

    const alt =
      (bi?.alt && bi.alt.length > 0 ? bi.alt : undefined) ??
      h.imageAlt?.trim() ??
      heroImageAltDefault;
    const mobileUrl =
      bi?.mobile.url && bi.mobile.url.length > 0 ? bi.mobile.url : DEFAULT_HERO_BACKGROUND;
    const desktopUrl =
      bi?.desktop.url && bi.desktop.url.length > 0 ? bi.desktop.url : mobileUrl;

    return {
      title: h.title,
      claim: h.claim,
      primaryCtaLabel: h.primaryCtaLabel,
      primaryCtaUrl: h.primaryCtaUrl,
      backgroundImage: {
        alt,
        mobile: { url: mobileUrl },
        desktop: { url: desktopUrl },
      },
    };
  });

const aktuellCtaSchema = z
  .object({
    enabled: z.boolean().optional(),
    label: z.string().optional(),
    href: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) {
      return;
    }

    if (!value.label?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: "Bitte einen Button-Text eintragen.",
      });
    }

    const href = value.href?.trim();
    if (!href) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: "Bitte eine Button-Link-URL eintragen.",
      });
      return;
    }

    const isValidHref =
      /^https?:\/\/\S+$/i.test(href) ||
      /^mailto:\S+@\S+\.\S+$/i.test(href) ||
      /^#[a-z0-9-]+$/i.test(href) ||
      /^\/\S*$/i.test(href);
    if (!isValidHref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: "Ungültiger Link. Erlaubt: https://, http://, mailto:, #anker oder /pfad.",
      });
    }
  });

export const aktuellesItemSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  badgeLabel: z.string().max(40).optional(),
  badgeEnabled: z.boolean().optional(),
  text: z.string(),
  image: siteResponsiveImageSchema,
  cta: aktuellCtaSchema.optional(),
  sortOrder: z.number(),
});

export const aktuellesSectionSchema = z.object({
  title: z.string().optional(),
  intro: z.string().optional(),
  items: z.array(aktuellesItemSchema).max(10),
});

export const siteContentSchema = z.object({
  hero: heroSectionSchema,
  aktuell: aktuellesSectionSchema,
  courses: z.array(courseSchema).max(50),
  prices: z.array(priceItemSchema).max(10),
  about: aboutSectionSchema,
  contact: contactSectionSchema,
  settings: generalSettingsSchema,
  legal: legalContentSchema,
});

export type ParsedSiteContent = z.infer<typeof siteContentSchema>;
