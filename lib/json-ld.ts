import type { InternalCourse, SiteContent } from "@/types/site-content";
import { isExternalCourse } from "@/types/site-content";

import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/site-url";
import type { YogaflowSeriesBlock } from "@/lib/yogaflow-series-group";
import { groupYogaflowCoursesIntoSeries } from "@/lib/yogaflow-series-group";

type JsonLdThing = Record<string, unknown>;

function imageObject(url: string | undefined): JsonLdThing | undefined {
  if (!url) return undefined;
  return { "@type": "ImageObject", url };
}

function placeNamed(location: string | undefined): JsonLdThing | undefined {
  const name = location?.trim();
  if (!name) return undefined;
  return { "@type": "Place", name };
}

function propertyValue(name: string, value: string | undefined): JsonLdThing | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  return { "@type": "PropertyValue", name, value: v };
}

function normalizedUrlHref(url: string): string {
  const t = url.trim();
  try {
    return new URL(t).href;
  } catch {
    return t;
  }
}

function buildWebApplications(content: SiteContent, baseUrl: string): JsonLdThing[] {
  const { hero, settings } = content;
  const heroUrl = hero.primaryCtaUrl?.trim();
  const heroLabel = hero.primaryCtaLabel?.trim();
  const appUrl = settings.appUrl?.trim();
  const apps: JsonLdThing[] = [];

  if (heroUrl && heroLabel) {
    apps.push({
      "@type": "WebApplication",
      "@id": `${baseUrl}#webapp-hero-cta`,
      name: heroLabel,
      url: heroUrl,
    });
  }

  const coursesSectionButtonLabel =
    settings.coursesSectionAppButtonLabel?.trim() || "Kurs buchen";
  if (
    appUrl &&
    (!heroUrl || normalizedUrlHref(appUrl) !== normalizedUrlHref(heroUrl))
  ) {
    apps.push({
      "@type": "WebApplication",
      "@id": `${baseUrl}#webapp-kurse-sektion`,
      name: coursesSectionButtonLabel,
      url: appUrl,
    });
  }

  return apps;
}

function buildCourseInstances(
  baseUrl: string,
  displayTitle: string,
  sessions: InternalCourse[],
  locationName: string | undefined,
): JsonLdThing[] | undefined {
  if (sessions.length === 0) return undefined;
  const place = placeNamed(locationName);
  return sessions.map((session) => {
    const props = [
      propertyValue("Wochentag", session.day),
      propertyValue("Zeit", session.time),
    ].filter(Boolean) as JsonLdThing[];

    const inst: JsonLdThing = {
      "@type": "CourseInstance",
      "@id": `${baseUrl}#course-session-${session.id}`,
      name: `${displayTitle} (${session.day})`,
      ...(props.length ? { additionalProperty: props } : {}),
      ...(place ? { location: place } : {}),
    };
    return inst;
  });
}

function buildSeriesCourseNode(
  baseUrl: string,
  idOrganization: string,
  block: YogaflowSeriesBlock,
): JsonLdThing {
  const { series, sessions } = block;
  const props = [
    propertyValue("Wochentag", series.day),
    propertyValue("Zeit", series.time),
    propertyValue("Preis", series.price),
  ].filter(Boolean) as JsonLdThing[];

  const place = placeNamed(series.location);
  const instances = buildCourseInstances(
    baseUrl,
    series.displayTitle,
    sessions,
    series.location,
  );

  return {
    "@type": "Course",
    "@id": `${baseUrl}#course-series-${series.id}`,
    name: series.displayTitle,
    provider: { "@id": idOrganization },
    ...(place ? { location: place } : {}),
    ...(props.length ? { additionalProperty: props } : {}),
    ...(instances?.length ? { hasCourseInstance: instances } : {}),
  };
}

function buildManualCourseNode(
  baseUrl: string,
  idOrganization: string,
  course: SiteContent["courses"][number],
): JsonLdThing {
  const props = [
    propertyValue("Wochentag", course.day),
    propertyValue("Zeit", course.time),
    propertyValue("Preis", course.price),
  ].filter(Boolean) as JsonLdThing[];

  const place = placeNamed(course.location);
  const node: JsonLdThing = {
    "@type": "Course",
    "@id": `${baseUrl}#course-manual-${course.id}`,
    name: course.title,
    provider: { "@id": idOrganization },
    ...(place ? { location: place } : {}),
    ...(props.length ? { additionalProperty: props } : {}),
  };

  if (isExternalCourse(course)) {
    node.url = course.externalUrl.trim();
  }

  return node;
}

function buildPriceOffer(item: SiteContent["prices"][number]): JsonLdThing {
  const offer: JsonLdThing = {
    "@type": "Offer",
    name: item.title,
  };
  const pill = item.price?.trim();
  if (pill) offer.description = pill;

  const link = item.linkUrl?.trim();
  if (link) {
    const absolute = /^https?:\/\//i.test(link) ? link : toAbsoluteSiteUrl(link);
    if (absolute) offer.url = absolute;
  }

  return offer;
}

/**
 * Schema.org @graph für die öffentliche Site: WebSite, Organization, Person,
 * Kontakt (ContactPoint), App-Links (WebApplication), Kurse und Preise – nur Felder,
 * die die UI ohnehin zeigt (kein Markdown-Fließtext, keine erfundenen Event-Daten).
 */
export function buildSiteJsonLd(content: SiteContent): JsonLdThing {
  const baseUrl = getSiteUrl();
  const idWebsite = `${baseUrl}#website`;
  const idOrganization = `${baseUrl}#organization`;
  const idPerson = `${baseUrl}#person`;
  const idCourseList = `${baseUrl}#kurse-termine`;
  const idPriceCatalog = `${baseUrl}#preise`;

  const { settings, contact, about, courses: manualCourses } = content;
  const name = settings.businessName;
  const description = settings.metaDescription?.trim() || undefined;

  const logoUrl = toAbsoluteSiteUrl(settings.logo?.desktop.url ?? settings.logo?.mobile.url);
  const ogUrl = toAbsoluteSiteUrl(
    settings.ogImage?.desktop.url?.trim() || settings.ogImage?.mobile.url?.trim(),
  );
  const aboutImageUrl = toAbsoluteSiteUrl(about.image.desktop.url ?? about.image.mobile.url);
  const orgImage = imageObject(ogUrl ?? aboutImageUrl);

  const personImage = imageObject(aboutImageUrl);
  const person: JsonLdThing = {
    "@type": "Person",
    "@id": idPerson,
    name,
    url: baseUrl,
    ...(personImage ? { image: personImage } : {}),
  };

  const email = contact.email.trim() || undefined;
  const phone = contact.phone.trim() || undefined;
  const contactPoint: JsonLdThing | undefined =
    email || phone
      ? {
          "@type": "ContactPoint",
          "@id": `${baseUrl}#contact-point`,
          contactType: "customer service",
          ...(email ? { email } : {}),
          ...(phone ? { telephone: phone } : {}),
        }
      : undefined;

  const organization: JsonLdThing = {
    "@type": "Organization",
    "@id": idOrganization,
    name,
    url: baseUrl,
    founder: { "@id": idPerson },
    ...(logoUrl && { logo: imageObject(logoUrl) }),
    ...(orgImage && { image: orgImage }),
    ...(email && { email }),
    ...(phone && { telephone: phone }),
    ...(contactPoint ? { contactPoint } : {}),
  };

  const seriesBlocks = groupYogaflowCoursesIntoSeries(
    settings.yogaflowCourseSeries ?? [],
    content.yogaflowCourses ?? [],
  );

  const courseItemElements: JsonLdThing[] = [];
  let position = 0;
  for (const block of seriesBlocks) {
    position += 1;
    courseItemElements.push({
      "@type": "ListItem",
      position,
      item: buildSeriesCourseNode(baseUrl, idOrganization, block),
    });
  }
  for (const course of manualCourses) {
    position += 1;
    courseItemElements.push({
      "@type": "ListItem",
      position,
      item: buildManualCourseNode(baseUrl, idOrganization, course),
    });
  }

  const priceItems = content.prices;
  const priceListElements: JsonLdThing[] = priceItems.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: buildPriceOffer(p),
  }));

  const mainEntityRefs: JsonLdThing[] = [];
  if (courseItemElements.length > 0) {
    mainEntityRefs.push({ "@id": idCourseList });
  }
  if (priceListElements.length > 0) {
    mainEntityRefs.push({ "@id": idPriceCatalog });
  }

  const website: JsonLdThing = {
    "@type": "WebSite",
    "@id": idWebsite,
    url: baseUrl,
    name,
    ...(description && { description }),
    publisher: { "@id": idOrganization },
    ...(mainEntityRefs.length === 1 && { mainEntity: mainEntityRefs[0] }),
    ...(mainEntityRefs.length > 1 && { mainEntity: mainEntityRefs }),
  };

  const graph: JsonLdThing[] = [website, organization, person];

  if (courseItemElements.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": idCourseList,
      name: settings.coursesSectionTitle?.trim() || "Kurse & Termine",
      numberOfItems: courseItemElements.length,
      itemListElement: courseItemElements,
    });
  }

  if (priceListElements.length > 0) {
    graph.push({
      "@type": "OfferCatalog",
      "@id": idPriceCatalog,
      name: settings.pricesSectionTitle?.trim() || "Preise",
      numberOfItems: priceListElements.length,
      itemListElement: priceListElements,
    });
  }

  graph.push(...buildWebApplications(content, baseUrl));

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
