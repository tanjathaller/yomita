import type { ContactSection as ContactModel } from "@/types/site-content";

import { ContactForm } from "@/components/forms/contact-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionShell } from "@/components/shared/section-shell";

type ContactSectionProps = {
  contact: ContactModel;
};

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <SectionShell id="kontakt" waveInto="muted-footer" className="-mt-px">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-4">
          <SectionHeading title={contact.formHeadline} />
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            {contact.formText}
          </p>
          <dl className="text-muted-foreground space-y-2 text-sm">
            <div>
              <dt className="text-foreground font-medium">E-Mail</dt>
              <dd>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-foreground font-medium">Telefon</dt>
              <dd>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {contact.phone}
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
