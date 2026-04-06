import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminAuthenticated } from "@/lib/admin-auth";

import { loginOwnerAction } from "../actions";

type LoginPageProps = {
  searchParams: { next?: string };
};

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card className="ring-primary/15" noHover>
          <CardHeader>
            <CardTitle>Bereits eingeloggt</CardTitle>
            <CardDescription>Du bist bereits als Owner angemeldet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-primary underline-offset-4 hover:underline" href="/admin">
              Zum Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="ring-primary/15" noHover>
        <CardHeader>
          <CardTitle>Owner Login</CardTitle>
          <CardDescription>Nur der Webseiten-Owner darf auf das Dashboard zugreifen.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm action={loginOwnerAction} nextPath={searchParams.next} />
        </CardContent>
      </Card>
    </div>
  );
}
