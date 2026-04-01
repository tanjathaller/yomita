"use client";

import { type ReactNode, useActionState, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle } from "lucide-react";

import type { SaveContentActionState } from "@/app/(admin)/admin/actions";
import type { Course, NavItem, PriceItem, SiteContent } from "@/types/site-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_ITEMS_PER_LIST = 10;
const SORT_ORDER_HELP_TEXT = "Niedrige Zahl = weiter oben auf der öffentlichen Website.";

type SectionKey =
  | "hero"
  | "aktuell"
  | "courses"
  | "prices"
  | "about"
  | "contact"
  | "settings"
  | "legal";

const sections: Array<{ id: SectionKey; label: string }> = [
  { id: "hero", label: "Hero" },
  { id: "aktuell", label: "Aktuelles" },
  { id: "courses", label: "Kurse" },
  { id: "prices", label: "Preise" },
  { id: "about", label: "Über mich" },
  { id: "contact", label: "Kontakt" },
  { id: "settings", label: "Einstellungen" },
  { id: "legal", label: "Rechtliches" },
];

type AdminDashboardProps = {
  initialContent: SiteContent;
  saveAction: (
    prevState: SaveContentActionState,
    formData: FormData,
  ) => Promise<SaveContentActionState>;
};

function buildId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function getNextSortOrder(items: Array<{ sortOrder: number }>): number {
  return (Math.max(0, ...items.map((item) => item.sortOrder)) || 0) + 10;
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function SortOrderLabel() {
  return (
    <span className="inline-flex items-center gap-1.5">
      Reihenfolge
      <span
        className="inline-flex cursor-help items-center"
        title={SORT_ORDER_HELP_TEXT}
        aria-label={SORT_ORDER_HELP_TEXT}
      >
        <AlertCircle className="size-3.5 text-muted-foreground" />
      </span>
    </span>
  );
}

function deriveAltFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scrollToCard(selector: string): void {
  requestAnimationFrame(() => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstField = element.querySelector<HTMLElement>("input, textarea, select, button");
    firstField?.focus();
  });
}

function MarkdownEditor({
  label,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} />
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Vorschau
        </p>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ initialContent, saveAction }: AdminDashboardProps) {
  const [draft, setDraft] = useState<SiteContent>(initialContent);
  const [activeSection, setActiveSection] = useState<SectionKey>("hero");
  const [saveState, saveFormAction, savePending] = useActionState(saveAction, {});
  const [sectionTabsTop, setSectionTabsTop] = useState(104);
  const [uploadingAktuellById, setUploadingAktuellById] = useState<Record<string, boolean>>({});
  const [uploadErrorAktuellById, setUploadErrorAktuellById] = useState<Record<string, string>>({});
  const [selectedAktuellFileById, setSelectedAktuellFileById] = useState<Record<string, string>>({});
  const aktuellFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const serializedContent = useMemo(() => JSON.stringify(draft), [draft]);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-admin-header]");
    if (!header) {
      return;
    }

    const updateTopOffset = () => {
      setSectionTabsTop(Math.max(0, header.offsetHeight - 1));
    };

    updateTopOffset();
    const observer = new ResizeObserver(updateTopOffset);
    observer.observe(header);
    window.addEventListener("resize", updateTopOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTopOffset);
    };
  }, []);

  const navigation = draft.settings.navigation ?? [];

  const uploadAktuellImage = async (itemId: string, file: File) => {
    setUploadingAktuellById((prev) => ({ ...prev, [itemId]: true }));
    setUploadErrorAktuellById((prev) => ({ ...prev, [itemId]: "" }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const raw = await response.text();
      let data: { error?: string; url?: string } = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as { error?: string; url?: string };
        } catch {
          throw new Error(`Upload-Antwort ungueltig (HTTP ${response.status}).`);
        }
      }

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload fehlgeschlagen.");
      }

      setDraft((prev) => ({
        ...prev,
        aktuell: {
          ...prev.aktuell,
          items: prev.aktuell.items.map((current) =>
            current.id === itemId
              ? {
                  ...current,
                  image: {
                    ...current.image,
                    url: data.url!,
                    alt: current.image.alt.trim() ? current.image.alt : deriveAltFromFilename(file.name),
                  },
                }
              : current,
          ),
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
      setUploadErrorAktuellById((prev) => ({ ...prev, [itemId]: message }));
    } finally {
      setUploadingAktuellById((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky z-30" style={{ top: `${sectionTabsTop}px` }}>
        <div className="-mx-4 border-b border-border/80 bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div
            className="hide-scrollbar overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none"
            style={{ touchAction: "pan-x" }}
          >
            <div className="flex w-max min-w-full gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  type="button"
                  variant={activeSection === section.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Admin-Dashboard</CardTitle>
            <CardDescription>
              Es werden nur Texte und Bilder gepflegt. Struktur und Reihenfolge der Website bleiben fix.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={saveFormAction} className="space-y-5">
            <input type="hidden" name="content" value={serializedContent} />

            {activeSection === "hero" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Hero Titel</Label>
                  <Input
                    value={draft.hero.title}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, hero: { ...prev.hero, title: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Claim</Label>
                  <Textarea
                    value={draft.hero.claim}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, hero: { ...prev.hero, claim: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Label</Label>
                  <Input
                    value={draft.hero.primaryCtaLabel}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaLabel: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input
                    value={draft.hero.primaryCtaUrl}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaUrl: event.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}

            {activeSection === "aktuell" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input
                      value={draft.aktuell.title ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          aktuell: { ...prev.aktuell, title: event.target.value || undefined },
                        }))
                      }
                    />
                  </div>
                </div>
                <MarkdownEditor
                  label="Intro (Markdown)"
                  value={draft.aktuell.intro ?? ""}
                  rows={4}
                  onChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      aktuell: { ...prev.aktuell, intro: value || undefined },
                    }))
                  }
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Cards ({draft.aktuell.items.length}/10)</p>
                    <Button
                      type="button"
                      size="sm"
                      disabled={draft.aktuell.items.length >= MAX_ITEMS_PER_LIST}
                      onClick={() => {
                        const newItemId = buildId("aktuell");
                        setDraft((prev) => ({
                          ...prev,
                          aktuell: {
                            ...prev.aktuell,
                            items: [
                              ...prev.aktuell.items,
                              {
                                id: newItemId,
                                title: "Neues Thema",
                                text: "",
                                image: { url: "", alt: "" },
                                sortOrder: getNextSortOrder(prev.aktuell.items),
                              },
                            ],
                          },
                        }));
                        scrollToCard(`[data-aktuell-card-id="${newItemId}"]`);
                      }}
                    >
                      Card hinzufügen
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
                    {draft.aktuell.items.map((item, index) => (
                    <div key={item.id} data-aktuell-card-id={item.id}>
                      <Card size="sm">
                        <CardHeader className="-mx-3 -mt-3 rounded-t-xl border-b border-border/60 bg-gradient-to-b from-muted/75 via-muted/35 to-transparent px-3 pt-3 pb-2">
                          <CardTitle className="pl-1 text-sm font-bold">Card {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>ID</Label>
                              <Input
                                value={item.id}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? { ...current, id: event.target.value }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>
                                <SortOrderLabel />
                              </Label>
                              <Input
                                type="number"
                                value={item.sortOrder}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? { ...current, sortOrder: parseNumber(event.target.value) }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Titel</Label>
                            <Input
                              value={item.title ?? ""}
                              onChange={(event) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  aktuell: {
                                    ...prev.aktuell,
                                    items: prev.aktuell.items.map((current) =>
                                      current.id === item.id
                                        ? { ...current, title: event.target.value || undefined }
                                        : current,
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                          <MarkdownEditor
                            label="Text (Markdown)"
                            value={item.text}
                            rows={4}
                            onChange={(value) =>
                              setDraft((prev) => ({
                                ...prev,
                                aktuell: {
                                  ...prev.aktuell,
                                  items: prev.aktuell.items.map((current) =>
                                    current.id === item.id ? { ...current, text: value } : current,
                                  ),
                                },
                              }))
                            }
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Bild URL</Label>
                              <Input
                                value={item.image.url}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? { ...current, image: { ...current.image, url: event.target.value } }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Bild hochladen</Label>
                              <input
                                ref={(element) => {
                                  aktuellFileInputRefs.current[item.id] = element;
                                }}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={uploadingAktuellById[item.id] ?? false}
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) {
                                    return;
                                  }

                                  setSelectedAktuellFileById((prev) => ({ ...prev, [item.id]: file.name }));
                                  await uploadAktuellImage(item.id, file);
                                  event.target.value = "";
                                }}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-primary/40 bg-primary/5 text-primary transition-transform transition-shadow duration-150 hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-sm active:translate-y-0"
                                  disabled={uploadingAktuellById[item.id] ?? false}
                                  onClick={() => aktuellFileInputRefs.current[item.id]?.click()}
                                >
                                  Datei auswaehlen
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {selectedAktuellFileById[item.id] ?? "Keine Datei ausgewaehlt"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Erlaubt: JPG, PNG, WEBP (max. 5 MB)
                              </p>
                              {uploadingAktuellById[item.id] ? (
                                <p className="text-xs text-muted-foreground">Upload laeuft...</p>
                              ) : null}
                              {uploadErrorAktuellById[item.id] ? (
                                <p className="text-xs text-destructive">{uploadErrorAktuellById[item.id]}</p>
                              ) : null}
                            </div>
                            <div className="space-y-2">
                              <Label>Bild Alt-Text</Label>
                              <Input
                                value={item.image.alt}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? { ...current, image: { ...current.image, alt: event.target.value } }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  aktuell: {
                                    ...prev.aktuell,
                                    items: prev.aktuell.items.filter((current) => current.id !== item.id),
                                  },
                                }))
                              }
                            >
                              Entfernen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "courses" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Kurse ({draft.courses.length}/10)</p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={draft.courses.length >= MAX_ITEMS_PER_LIST}
                    onClick={() => {
                      const newCourseId = buildId("course");
                      setDraft((prev) => ({
                        ...prev,
                        courses: [
                          ...prev.courses,
                          {
                            id: newCourseId,
                            type: "internal",
                            title: "Neuer Kurs",
                            description: "",
                            day: "",
                            time: "",
                            location: "",
                            bookingStatus: "available",
                            sortOrder: getNextSortOrder(prev.courses),
                          },
                        ],
                      }));
                      scrollToCard(`[data-course-card-id="${newCourseId}"]`);
                    }}
                  >
                    Kurs hinzufügen
                  </Button>
                </div>
                {draft.courses.map((course, index) => (
                  <div key={course.id} data-course-card-id={course.id}>
                    <CourseEditor
                      course={course}
                      index={index}
                      onChange={(nextCourse) =>
                        setDraft((prev) => ({
                          ...prev,
                          courses: prev.courses.map((current) =>
                            current.id === course.id ? nextCourse : current,
                          ),
                        }))
                      }
                      onRemove={() =>
                        setDraft((prev) => ({
                          ...prev,
                          courses: prev.courses.filter((current) => current.id !== course.id),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {activeSection === "prices" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Preise ({draft.prices.length}/10)</p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={draft.prices.length >= MAX_ITEMS_PER_LIST}
                    onClick={() => {
                      const newPriceId = buildId("price");
                      setDraft((prev) => ({
                        ...prev,
                        prices: [
                          ...prev.prices,
                          {
                            id: newPriceId,
                            title: "Neuer Tarif",
                            price: "",
                            description: "",
                            sortOrder: getNextSortOrder(prev.prices),
                          },
                        ],
                      }));
                      scrollToCard(`[data-price-card-id="${newPriceId}"]`);
                    }}
                  >
                    Preis-Card hinzufügen
                  </Button>
                </div>
                {draft.prices.map((price, index) => (
                  <div key={price.id} data-price-card-id={price.id}>
                    <PriceEditor
                      item={price}
                      index={index}
                      onChange={(nextPrice) =>
                        setDraft((prev) => ({
                          ...prev,
                          prices: prev.prices.map((current) =>
                            current.id === price.id ? nextPrice : current,
                          ),
                        }))
                      }
                      onRemove={() =>
                        setDraft((prev) => ({
                          ...prev,
                          prices: prev.prices.filter((current) => current.id !== price.id),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {activeSection === "about" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={draft.about.title}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, about: { ...prev.about, title: event.target.value } }))
                    }
                  />
                </div>
                <MarkdownEditor
                  label="Fließtext (Markdown)"
                  value={draft.about.text}
                  rows={8}
                  onChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      about: { ...prev.about, text: value },
                    }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bild URL</Label>
                    <Input
                      value={draft.about.image.url}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          about: { ...prev.about, image: { ...prev.about.image, url: event.target.value } },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bild Alt-Text</Label>
                    <Input
                      value={draft.about.image.alt}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          about: { ...prev.about, image: { ...prev.about.image, alt: event.target.value } },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "contact" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input
                    value={draft.contact.email}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, contact: { ...prev.contact, email: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={draft.contact.phone}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, contact: { ...prev.contact, phone: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Formular-Headline</Label>
                  <Input
                    value={draft.contact.formHeadline}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, formHeadline: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <MarkdownEditor
                    label="Formular-Text (Markdown)"
                    value={draft.contact.formText}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, formText: value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Success-Nachricht</Label>
                  <Textarea
                    value={draft.contact.formSuccessMessage ?? ""}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, formSuccessMessage: event.target.value || undefined },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Empfänger E-Mail (optional)</Label>
                  <Input
                    value={draft.contact.formRecipientEmail ?? ""}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, formRecipientEmail: event.target.value || undefined },
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}

            {activeSection === "settings" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Business Name" value={draft.settings.businessName} onChange={(value) =>
                    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, businessName: value } }))
                  } />
                  <Field label="Nav Wordmark" value={draft.settings.navWordmark ?? ""} onChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, navWordmark: value || undefined },
                    }))
                  } />
                  <Field label="App URL" value={draft.settings.appUrl} onChange={(value) =>
                    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, appUrl: value } }))
                  } />
                  <Field label="Logo URL" value={draft.settings.logoUrl ?? ""} onChange={(value) =>
                    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, logoUrl: value || undefined } }))
                  } />
                  <Field label="Site Title" value={draft.settings.siteTitle ?? ""} onChange={(value) =>
                    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, siteTitle: value || undefined } }))
                  } />
                  <Field label="OG Image URL" value={draft.settings.ogImageUrl ?? ""} onChange={(value) =>
                    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ogImageUrl: value || undefined } }))
                  } />
                  <div className="space-y-2 md:col-span-2">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={draft.settings.metaDescription ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, metaDescription: event.target.value || undefined },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Navigationseinträge</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            navigation: [...navigation, { label: "Neuer Link", href: "#hero" }],
                          },
                        }))
                      }
                    >
                      Link hinzufügen
                    </Button>
                  </div>
                  {navigation.map((item, index) => (
                    <NavItemEditor
                      key={`${item.label}-${index}`}
                      item={item}
                      onChange={(nextItem) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            navigation: navigation.map((current, currentIndex) =>
                              currentIndex === index ? nextItem : current,
                            ),
                          },
                        }))
                      }
                      onRemove={() =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            navigation: navigation.filter((_, currentIndex) => currentIndex !== index),
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "legal" ? (
              <div className="space-y-4">
                <MarkdownEditor
                  label="Impressum (Markdown)"
                  value={draft.legal.imprintText}
                  rows={8}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, legal: { ...prev.legal, imprintText: value } }))
                  }
                />
                <MarkdownEditor
                  label="Datenschutz (Markdown)"
                  value={draft.legal.privacyText}
                  rows={8}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, legal: { ...prev.legal, privacyText: value } }))
                  }
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button type="submit" disabled={savePending}>
                {savePending ? "Speichern..." : "Änderungen speichern"}
              </Button>
              {saveState.message ? <p className="text-sm text-emerald-700">{saveState.message}</p> : null}
              {saveState.error ? <p className="text-sm text-destructive">{saveState.error}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function CourseEditor({
  course,
  index,
  onChange,
  onRemove,
}: {
  course: Course;
  index: number;
  onChange: (course: Course) => void;
  onRemove: () => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Kurs {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ID" value={course.id} onChange={(value) => onChange({ ...course, id: value })} />
          <div className="space-y-2">
            <Label>Typ</Label>
            <select
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
              value={course.type}
              onChange={(event) => {
                if (event.target.value === "external") {
                  onChange(
                    "externalUrl" in course
                      ? { ...course, type: "external" }
                      : { ...course, type: "external", externalUrl: "https://" },
                  );
                  return;
                }
                if ("externalUrl" in course) {
                  const nextCourse = { ...course, type: "internal" } as Course & {
                    externalUrl?: string;
                  };
                  delete nextCourse.externalUrl;
                  onChange(nextCourse as Course);
                  return;
                }
                onChange({ ...course, type: "internal" });
              }}
            >
              <option value="internal">internal</option>
              <option value="external">external</option>
            </select>
          </div>
          <Field label="Titel" value={course.title} onChange={(value) => onChange({ ...course, title: value })} />
          <Field
            label={<SortOrderLabel />}
            value={String(course.sortOrder)}
            onChange={(value) => onChange({ ...course, sortOrder: parseNumber(value) })}
          />
          <Field label="Tag" value={course.day} onChange={(value) => onChange({ ...course, day: value })} />
          <Field label="Zeit" value={course.time} onChange={(value) => onChange({ ...course, time: value })} />
          <Field
            label="Ort"
            value={course.location}
            onChange={(value) => onChange({ ...course, location: value })}
          />
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
              value={course.bookingStatus}
              onChange={(event) =>
                onChange({
                  ...course,
                  bookingStatus: event.target.value === "full" ? "full" : "available",
                })
              }
            >
              <option value="available">available</option>
              <option value="full">full</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea value={course.description} onChange={(event) => onChange({ ...course, description: event.target.value })} />
        </div>
        {course.type === "internal" ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Field
              label="Start (optional)"
              value={course.startsOn ?? ""}
              onChange={(value) => onChange({ ...course, startsOn: value || undefined })}
            />
            <Field
              label="Ende (optional)"
              value={course.endsOn ?? ""}
              onChange={(value) => onChange({ ...course, endsOn: value || undefined })}
            />
            <Field
              label="Schedule Note (optional)"
              value={course.scheduleNote ?? ""}
              onChange={(value) => onChange({ ...course, scheduleNote: value || undefined })}
            />
          </div>
        ) : (
          <Field
            label="Externer Link"
            value={course.externalUrl}
            onChange={(value) => onChange({ ...course, externalUrl: value })}
          />
        )}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onRemove}>
            Entfernen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PriceEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: PriceItem;
  index: number;
  onChange: (item: PriceItem) => void;
  onRemove: () => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Preis {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ID" value={item.id} onChange={(value) => onChange({ ...item, id: value })} />
          <Field
            label={<SortOrderLabel />}
            value={String(item.sortOrder)}
            onChange={(value) => onChange({ ...item, sortOrder: parseNumber(value) })}
          />
          <Field label="Titel" value={item.title} onChange={(value) => onChange({ ...item, title: value })} />
          <Field label="Preis" value={item.price} onChange={(value) => onChange({ ...item, price: value })} />
          <Field
            label="Link URL (optional)"
            value={item.linkUrl ?? ""}
            onChange={(value) => onChange({ ...item, linkUrl: value || undefined })}
          />
          <Field
            label="Link Label (optional)"
            value={item.linkLabel ?? ""}
            onChange={(value) => onChange({ ...item, linkLabel: value || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea value={item.description} onChange={(event) => onChange({ ...item, description: event.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.highlighted ?? false}
            onChange={(event) => onChange({ ...item, highlighted: event.target.checked || undefined })}
          />
          Hervorgehoben
        </label>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onRemove}>
            Entfernen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NavItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: NavItem;
  onChange: (item: NavItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-2">
      <Field label="Label" value={item.label} onChange={(value) => onChange({ ...item, label: value })} />
      <Field label="Href" value={item.href} onChange={(value) => onChange({ ...item, href: value })} />
      <div className="md:col-span-2 md:flex md:justify-end">
        <Button type="button" variant="outline" onClick={onRemove}>
          Entfernen
        </Button>
      </div>
    </div>
  );
}
