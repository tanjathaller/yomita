import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getSiteContent } from "@/lib/get-site-content";

import { logoutOwnerAction, saveSiteContentAction } from "./actions";

export default async function AdminHomePage() {
  await requireAdminAuth();
  const content = await getSiteContent();

  return (
    <AdminDashboard
      initialContent={content}
      saveAction={saveSiteContentAction}
      logoutAction={logoutOwnerAction}
    />
  );
}
