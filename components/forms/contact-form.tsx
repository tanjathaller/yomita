"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/schemas/contact-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ContactFormProps = {
  successMessage?: string;
};

export function ContactForm({ successMessage }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  function onSubmit() {
    // POST /api/contact folgt (tech-decisions.md); Payload: form.getValues()
    setSubmitted(true);
    form.reset();
  }

  if (submitted) {
    return (
      <div
        className="bg-muted/50 rounded-xl border border-border p-6 text-sm"
        role="status"
        aria-live="polite"
      >
        {successMessage ??
          "Danke für deine Nachricht. Wir melden uns bald. (Demo – Backend folgt.)"}
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="bg-card text-card-foreground space-y-4 rounded-xl border border-border p-6 shadow-sm"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          autoComplete="name"
          aria-invalid={!!form.formState.errors.name}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className="text-destructive text-xs" role="alert">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">E-Mail</Label>
        <Input
          id="contact-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-destructive text-xs" role="alert">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-phone">Telefon</Label>
        <Input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={!!form.formState.errors.phone}
          {...form.register("phone")}
        />
        {form.formState.errors.phone ? (
          <p className="text-destructive text-xs" role="alert">
            {form.formState.errors.phone.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Nachricht</Label>
        <Textarea
          id="contact-message"
          rows={5}
          aria-invalid={!!form.formState.errors.message}
          {...form.register("message")}
        />
        {form.formState.errors.message ? (
          <p className="text-destructive text-xs" role="alert">
            {form.formState.errors.message.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Nachricht senden
      </Button>
      <p className="text-muted-foreground text-xs">
        Server-Versand ist noch nicht angebunden – Absenden zeigt nur die Demo-Meldung.
      </p>
    </form>
  );
}
