import type { GeneralSettings, NavItem } from "@/types/site-content";

import { defaultNavigation } from "@/lib/navigation-defaults";

const aktuellesHrefPattern = /#aktuelles$/;

/** When using built-in defaults, omit the „Aktuelles“ link if there is nothing to scroll to. */
export function resolveNavigation(
  settings: GeneralSettings,
  options?: { hasAktuellesItems?: boolean },
): NavItem[] {
  if (settings.navigation && settings.navigation.length > 0) {
    return settings.navigation;
  }
  if (options?.hasAktuellesItems === false) {
    return defaultNavigation.filter((item) => !aktuellesHrefPattern.test(item.href));
  }
  return defaultNavigation;
}
