"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Beim Admin ist ein Fehler aufgetreten</CardTitle>
          <CardDescription>
            Die Seite konnte nicht geladen werden. Bitte erneut versuchen oder zur Login-Seite gehen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground break-words">
            {error.message || "Unbekannter Fehler"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset}>
              Erneut versuchen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/admin/login";
              }}
            >
              Zur Login-Seite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
