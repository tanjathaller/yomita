import type { BookingBadgeLink } from "@/types/site-content";

/** DOM-Anker der One-Pager-Sektionen (vgl. content-model.md). */
export const BOOKING_BADGE_ANCHOR_PRESETS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "kontakt", label: "Kontakt (#kontakt)" },
  { value: "kurse", label: "Kurse (#kurse)" },
  { value: "preise", label: "Preise (#preise)" },
  { value: "aktuelles", label: "Aktuelles (#aktuelles)" },
  { value: "ueber-mich", label: "Über mich (#ueber-mich)" },
  { value: "hero", label: "Hero (#hero)" },
];

export type ResolvedBookingBadgeLink = {
  href: string;
  openInNewTab: boolean;
};

export function resolveBookingBadgeLink(
  link: BookingBadgeLink | undefined,
): ResolvedBookingBadgeLink | undefined {
  if (!link?.enabled) {
    return undefined;
  }
  if (link.kind === "url") {
    const u = link.url?.trim();
    if (!u || !/^https?:\/\/\S+$/i.test(u)) {
      return undefined;
    }
    return { href: u, openInNewTab: true };
  }
  if (link.kind !== "anchor") {
    return undefined;
  }
  const a = (link.anchor ?? "").trim().replace(/^#/, "");
  if (!a || !/^[a-z0-9-]+$/i.test(a)) {
    return undefined;
  }
  return { href: `/#${a}`, openInNewTab: false };
}
