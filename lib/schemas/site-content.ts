import { z } from "zod";

const bookingStatusSchema = z.enum(["available", "full"]);

const baseCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  day: z.string(),
  time: z.string(),
  location: z.string(),
  bookingStatus: bookingStatusSchema,
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
  linkLabel: z.string().min(1).optional(),
  sortOrder: z.number(),
  highlighted: z.boolean().optional(),
});

export const aboutSectionSchema = z.object({
  title: z.string(),
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
  formSuccessMessage: z.string().optional(),
  formRecipientEmail: z.string().optional(),
});

export const navItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const generalSettingsSchema = z.object({
  businessName: z.string(),
  navWordmark: z.string().optional(),
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

export const heroSectionSchema = z.object({
  title: z.string(),
  claim: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaUrl: z.string().min(1),
});

export const aktuellesItemSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  text: z.string(),
  image: z.object({
    url: z.string().min(1),
    alt: z.string().min(1),
  }),
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
  courses: z.array(courseSchema).max(10),
  prices: z.array(priceItemSchema).max(10),
  about: aboutSectionSchema,
  contact: contactSectionSchema,
  settings: generalSettingsSchema,
  legal: legalContentSchema,
});

export type ParsedSiteContent = z.infer<typeof siteContentSchema>;
