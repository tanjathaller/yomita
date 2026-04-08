import { contactFormSchema } from "@/lib/schemas/contact-form";
import { resolveContactRecipient, sendContactEmail } from "@/lib/send-contact-email";

const SERVICE_UNAVAILABLE_MESSAGE =
  "Das Kontaktformular ist vorübergehend nicht erreichbar. Bitte versuche es später erneut oder schreib eine E-Mail.";

const SEND_FAILED_MESSAGE =
  "Die Nachricht konnte nicht gesendet werden. Bitte versuche es in ein paar Minuten erneut.";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "invalid_json", message: "Ungültige Anfrage." },
      { status: 400 },
    );
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "validation_error",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const toEmail = await resolveContactRecipient();

  if (!apiKey || !fromEmail || !toEmail) {
    return Response.json(
      { error: "service_unavailable", message: SERVICE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    );
  }

  const sendResult = await sendContactEmail(parsed.data, {
    to: toEmail,
    from: fromEmail,
    apiKey,
  });

  if (!sendResult.ok) {
    return Response.json(
      { error: "send_failed", message: SEND_FAILED_MESSAGE },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
