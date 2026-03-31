import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getSiteContent } from "@/lib/get-site-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { logoutOwnerAction, saveSiteContentAction } from "./actions";

export default async function AdminHomePage() {
  await requireAdminAuth();
  try {
    const content = await getSiteContent();

    return (
      <AdminDashboard
        initialContent={content}
        saveAction={saveSiteContentAction}
        logoutAction={logoutOwnerAction}
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
