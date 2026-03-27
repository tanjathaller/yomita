import type { ContactSection as ContactModel } from "@/types/site-content";

import { ContactForm } from "@/components/forms/contact-form";
import { SectionShell } from "@/components/shared/section-shell";

type ContactSectionProps = {
  contact: ContactModel;
};

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <SectionShell id="kontakt" waveInto="muted-footer" className="-mt-px">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-6">
          <div className="max-w-2xl pl-4 sm:pl-6">
            <div className="relative inline-block pr-6 sm:pr-7">
              <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight sm:text-6xl">
                {contact.formHeadline}
              </h2>
              <span aria-hidden className="mt-2 ml-3 block h-1 w-28 rounded-full bg-border/80" />
            </div>
          </div>
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed sm:text-base">
            Für Fragen oder Anfragen kannst du dich gern über das Formular bei mir melden. Ich
            antworte dir zeitnah.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="sr-only">E-Mail</dt>
              <dd>
                <a
                  href={`mailto:${contact.email}`}
                  className="group block rounded-xl border border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="text-foreground text-sm font-medium">E-Mail</span>
                  <span className="text-primary mt-1 block text-sm underline-offset-4 group-hover:underline">
                    {contact.email}
                  </span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Telefon</dt>
              <dd>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="group block rounded-xl border border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="text-foreground text-sm font-medium">Telefon</span>
                  <span className="text-primary mt-1 block text-sm underline-offset-4 group-hover:underline">
                    {contact.phone}
                  </span>
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <ContactForm successMessage={contact.formSuccessMessage} />
      </div>
    </SectionShell>
  );
}
