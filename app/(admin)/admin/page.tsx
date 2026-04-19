import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminAuth } from "@/lib/admin-auth";
import { disconnectSiteContentObjectGraph } from "@/lib/site-content-object-graph";
import { readSiteContent } from "@/lib/site-content-store";
import { withSortedLists } from "@/lib/sort-content";
import { mergeYogaflowCoursesIfConfigured } from "@/lib/yogaflow-courses-merge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { saveSiteContentAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdminAuth();
  try {
    const base = await readSiteContent();
    const mergedMeta = await mergeYogaflowCoursesIfConfigured(base);
    const content = disconnectSiteContentObjectGraph(withSortedLists(base));

    return (
      <AdminDashboard
        initialContent={content}
        saveAction={saveSiteContentAction}
        yogaflowSyncedAt={mergedMeta.yogaflowSyncedAt}
        yogaflowCoursesLoadError={mergedMeta.yogaflowCoursesLoadError ?? false}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="ring-primary/15" noHover>
          <CardHeader>
            <CardTitle>Admin konnte nicht geladen werden</CardTitle>
            <CardDescription>
              Bitte pruefe die Vercel Environment-Variablen fuer Admin, Blob und Redis/KV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">Technischer Hinweis:</p>
            <p className="text-muted-foreground break-words">{message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
