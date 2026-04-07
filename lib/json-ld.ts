import type { SiteContent } from "@/types/site-content";

import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/site-url";

type JsonLdThing = Record<string, unknown>;

function imageObject(url: string | undefined): JsonLdThing | undefined {
  if (!url) return undefined;
  return { "@type": "ImageObject", url };
}

/**
 * Minimal Schema.org @graph für die öffentliche Site (WebSite, Organization, Person).
 */
export function buildSiteJsonLd(content: SiteContent): JsonLdThing {
  const baseUrl = getSiteUrl();
  const idWebsite = `${baseUrl}#website`;
  const idOrganization = `${baseUrl}#organization`;
  const idPerson = `${baseUrl}#person`;

  const { settings, contact, about } = content;
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

  const organization: JsonLdThing = {
    "@type": "Organization",
    "@id": idOrganization,
    name,
    url: baseUrl,
    founder: { "@id": idPerson },
    ...(logoUrl && { logo: imageObject(logoUrl) }),
    ...(orgImage && { image: orgImage }),
    ...(contact.email.trim() && { email: contact.email.trim() }),
    ...(contact.phone.trim() && { telephone: contact.phone.trim() }),
  };

  const website: JsonLdThing = {
    "@type": "WebSite",
    "@id": idWebsite,
    url: baseUrl,
    name,
    ...(description && { description }),
    publisher: { "@id": idOrganization },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [website, organization, person],
  };
}
