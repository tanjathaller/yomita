/** Pfad zur Kursübersicht in der YogaFlow-Web-App (nach Origin). */
const YOGAFLOW_APP_COURSES_PATH = "/courses";

/**
 * Ziel-URL für Buchung/Warteliste aus der synchronisierten Terminliste:
 * immer die **Kurse**-Seite der App (`{origin}/courses`), nicht `settings.appUrl`
 * (oft `/auth` o. Ä.). Ohne Session leitet die App zur Login-Seite weiter.
 */
export function resolveYogaflowAppCoursesPageUrl(appUrl: string): string {
  const trimmed = appUrl.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    return `${u.origin}${YOGAFLOW_APP_COURSES_PATH}${u.search}${u.hash}`;
  } catch {
    return trimmed;
  }
}
