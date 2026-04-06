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

export const aboutSectionSchema = z.object({
  title: z.string(),
  eyebrow: z.string().optional(),
  text: z.string(),
  image: z.object({
    url: z.string().min(1),
    alt: z.string().min(1),
  }),
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

export const generalSettingsSchema = z.object({
  businessName: z.string(),
  navWordmark: z.string().optional(),
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
  logoUrl: z.string().optional(),
  siteTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageUrl: z.string().optional(),
  navigation: z.array(navItemSchema).optional(),
});

export const legalContentSchema = z.object({
  imprintText: z.string(),
  privacyText: z.string(),
});

const heroImageAltDefault = "Portrait – Yogastudio und Achtsamkeit";

export const heroSectionSchema = z.object({
  title: z.string(),
  claim: z.string(),
  imageAlt: z.string().min(1).default(heroImageAltDefault),
  primaryCtaLabel: z.string(),
  primaryCtaUrl: z.string().min(1),
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
  text: z.string(),
  image: z.object({
    url: z.string().min(1),
    alt: z.string().min(1),
  }),
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
