"use client";

import type { ContactSection as ContactModel } from "@/types/site-content";
import type { MouseEvent } from "react";
import { useState } from "react";

import { ContactForm } from "@/components/forms/contact-form";
import { SectionShell } from "@/components/shared/section-shell";
import { Button } from "@/components/ui/button";

type ContactSectionProps = {
  contact: ContactModel;
};

export function ContactSection({ contact }: ContactSectionProps) {
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  function handleEmailClick(event: MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      event.preventDefault();
      setShowEmailConfirm(true);
    }
  }

  function proceedToEmailApp() {
    window.location.href = `mailto:${contact.email}`;
    setShowEmailConfirm(false);
  }

  return (
    <SectionShell
      id="kontakt"
      className="pb-24 sm:pb-30 md:pb-34 bg-[linear-gradient(to_bottom,var(--background)_0%,var(--background)_58%,color-mix(in_oklab,var(--background)_84%,var(--surface-muted-footer)_16%)_74%,color-mix(in_oklab,var(--background)_60%,var(--surface-muted-footer)_40%)_88%,color-mix(in_oklab,var(--background)_32%,var(--surface-muted-footer)_68%)_97%,var(--surface-muted-footer)_100%)]"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
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
        </div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ContactForm successMessage={contact.formSuccessMessage} />
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:col-start-1 lg:row-start-2">
          <div>
            <dt className="sr-only">E-Mail</dt>
            <dd>
              <a
                href={`mailto:${contact.email}`}
                onClick={handleEmailClick}
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
      {showEmailConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1F2A22]/45 p-4 backdrop-blur-[1px] sm:items-center sm:p-6"
          onClick={() => setShowEmailConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-confirm-title"
            className="w-full max-w-sm rounded-2xl border border-primary/25 bg-[var(--surface-muted-band)] p-5 text-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="email-confirm-title" className="text-[#2F3B2A] text-lg font-semibold tracking-tight">
              Zur E-Mail-App wechseln?
            </h3>
            <p className="text-foreground/85 mt-2 text-sm leading-relaxed">
              Du kannst auch einfach das Kontaktformular auf dieser Seite verwenden.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button size="lg" variant="ghost" onClick={() => setShowEmailConfirm(false)}>
                Abbrechen
              </Button>
              <Button size="lg" onClick={proceedToEmailApp}>
                Weiter zur E-Mail
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </SectionShell>
  );
}
