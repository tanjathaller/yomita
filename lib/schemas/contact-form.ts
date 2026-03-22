import { z } from "zod";

/** Felder laut legal-and-forms.md */
export const contactFormSchema = z.object({
  name: z.string().min(1, "Bitte Namen angeben."),
  email: z.string().email("Bitte gültige E-Mail angeben."),
  phone: z.string().min(1, "Bitte Telefon angeben."),
  message: z.string().min(1, "Bitte Nachricht angeben."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
