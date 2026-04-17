"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearAdminSession,
  createAdminSession,
  requireAdminAuth,
  verifyOwnerPassword,
} from "@/lib/admin-auth";
import { siteContentSchema } from "@/lib/schemas/site-content";
import { saveSiteContent } from "@/lib/site-content-store";
import { withSortedLists } from "@/lib/sort-content";

const loginSchema = z.object({
  password: z.string().min(1, "Bitte Passwort eingeben."),
  next: z.string().optional(),
});

const saveSchema = z.object({
  content: z.string().min(1, "Es wurden keine Inhalte übermittelt."),
});

export type LoginActionState = {
  error?: string;
};

export async function loginOwnerAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  let isValid = false;
  try {
    isValid = await verifyOwnerPassword(parsed.data.password);
  } catch {
    return { error: "Admin-Login ist nicht vollständig konfiguriert." };
  }
  if (!isValid) {
    return { error: "Login fehlgeschlagen. Bitte Passwort prüfen." };
  }

  try {
    await createAdminSession();
  } catch {
    return { error: "ADMIN_SESSION_SECRET fehlt oder ist ungültig." };
  }
  const nextPath =
    parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/admin";
  redirect(nextPath);
}

export async function logoutOwnerAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

export type SaveContentActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export async function saveSiteContentAction(
  _previousState: SaveContentActionState,
  formData: FormData,
): Promise<SaveContentActionState> {
  await requireAdminAuth();

  const parsedForm = saveSchema.safeParse({
    content: formData.get("content"),
  });
  if (!parsedForm.success) {
    return {
      error: parsedForm.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(parsedForm.data.content);
  } catch {
    return { error: "JSON konnte nicht gelesen werden." };
  }

  const parsedContent = siteContentSchema.safeParse(parsedJson);
  if (!parsedContent.success) {
    const firstIssue = parsedContent.error.issues[0];
    const issuePath = firstIssue?.path.join(".") ?? "unknown";
    if (
      issuePath.includes("aktuell.items") &&
      (issuePath.endsWith("image.mobile.url") || issuePath.endsWith("image.desktop.url"))
    ) {
      return {
        error: "Bitte für jede Aktuelles-Karte Mobil- und Desktop-Bild-URL setzen (oder hochladen), bevor du speicherst.",
      };
    }
    if (issuePath.includes("image.alt")) {
      return {
        error: "Bitte einen Bild-Alt-Text eintragen (Pflichtfeld).",
      };
    }
    if (issuePath.includes("aktuell.items") && issuePath.endsWith("cta.label")) {
      return {
        error: "Bitte einen Button-Text eintragen oder den Button deaktivieren.",
      };
    }
    if (issuePath.includes("aktuell.items") && issuePath.endsWith("cta.href")) {
      return {
        error: "Bitte einen gültigen Button-Link eintragen oder den Button deaktivieren.",
      };
    }
    return {
      error: `Validierung fehlgeschlagen (${issuePath}): ${firstIssue?.message ?? "ungueltiger Wert"}.`,
    };
  }

  const normalized = withSortedLists(parsedContent.data);
  try {
    await saveSiteContent(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Speichern fehlgeschlagen.";
    return {
      error: `Speichern fehlgeschlagen: ${message}`,
    };
  }

  revalidatePath("/");
  revalidatePath("/impressum");
  revalidatePath("/datenschutz");
  revalidatePath("/llms.txt");
  /** Admin lädt `readSiteContent` per RSC; ohne Revalidation kann ein gecachter Stand mit falschen Bild-Referenzen zurückkommen. */
  revalidatePath("/admin");

  return {
    ok: true,
    message: `Änderungen gespeichert (${new Date().toLocaleTimeString("de-DE")}).`,
  };
}
