import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminAuth } from "@/lib/admin-auth";
import { readSiteContent } from "@/lib/site-content-store";
import { withSortedLists } from "@/lib/sort-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { saveSiteContentAction } from "./actions";

export default async function AdminHomePage() {
  await requireAdminAuth();
  try {
    const content = withSortedLists(await readSiteContent());

    return (
      <AdminDashboard
        initialContent={content}
        saveAction={saveSiteContentAction}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card>
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
