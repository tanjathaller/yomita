import "server-only";

import { Resend } from "resend";
import { z } from "zod";

import type { ContactFormValues } from "@/lib/schemas/contact-form";
import { readSiteContent } from "@/lib/site-content-store";

const emailSchema = z.string().email();

export async function resolveContactRecipient(): Promise<string | null> {
  const content = await readSiteContent();
  const fromCms = content.contact.formRecipientEmail?.trim();
  if (fromCms && emailSchema.safeParse(fromCms).success) {
    return fromCms;
  }
  const fromEnv = process.env.CONTACT_TO_EMAIL?.trim();
  if (fromEnv && emailSchema.safeParse(fromEnv).success) {
    return fromEnv;
  }
  return null;
}

export type SendContactEmailResult =
  | { ok: true }
  | { ok: false; providerMessage?: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactEmail(
  payload: ContactFormValues,
  options: { to: string; from: string; apiKey: string },
): Promise<SendContactEmailResult> {
  const resend = new Resend(options.apiKey);

  const text = [
    "Neue Kontaktanfrage über die Website",
    "",
    `Name: ${payload.name}`,
    `E-Mail: ${payload.email}`,
    `Telefon: ${payload.phone}`,
    "",
    "Nachricht:",
    payload.message,
  ].join("\n");

  const html = `<p>Neue Kontaktanfrage über die Website</p>
<ul>
<li><strong>Name:</strong> ${escapeHtml(payload.name)}</li>
<li><strong>E-Mail:</strong> ${escapeHtml(payload.email)}</li>
<li><strong>Telefon:</strong> ${escapeHtml(payload.phone)}</li>
</ul>
<p><strong>Nachricht:</strong></p>
<p>${escapeHtml(payload.message).replace(/\n/g, "<br/>")}</p>`;

  const { error } = await resend.emails.send({
    from: options.from,
    to: options.to,
    replyTo: payload.email,
    subject: `Kontaktanfrage Website – ${payload.name}`,
    text,
    html,
  });

  if (error) {
    return { ok: false, providerMessage: error.message };
  }
  return { ok: true };
}
