"use client";

import {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Heading3, Link2, ListOrdered } from "lucide-react";
import remarkBreaks from "remark-breaks";

import type { SaveContentActionState } from "@/app/(admin)/admin/actions";
import {
  ADMIN_MOBILE_SAVE_PORTAL_ID,
  ADMIN_SITE_CONTENT_FORM_ID,
} from "@/lib/admin-dashboard-ui";
import { BOOKING_BADGE_ANCHOR_PRESETS } from "@/lib/booking-badge-link";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { disconnectSiteContentObjectGraph } from "@/lib/site-content-object-graph";
import { cn } from "@/lib/utils";
import { DEFAULT_YOGAFLOW_COURSE_SERIES } from "@/lib/yogaflow-series-group";
import type {
  BookingBadgeLink,
  Course,
  NavItem,
  PriceItem,
  SiteContent,
  YogaflowCourseSeries,
} from "@/types/site-content";
import { isExternalCourse, isInternalCourse } from "@/types/site-content";
import {
  AdminImageFieldLabel,
  AdminSortOrderLabelRow,
} from "@/components/admin/admin-image-size-hint";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

function Card({ className, ...props }: ComponentProps<typeof UiCard>) {
  return <UiCard noHover className={cn("ring-primary/15", className)} {...props} />;
}

/** Sichtbarkeit der Desktop-Speicher-Meldung vor Beginn des Ausblendens. */
const DESKTOP_SAVE_FEEDBACK_VISIBLE_MS = 3000;
/** Dauer des Ausblendens (Opacity). */
const DESKTOP_SAVE_FEEDBACK_FADE_MS = 520;

const MAX_ITEMS_PER_LIST = 10;
const MAX_COURSES = 50;

const adminSelectClass = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

/** Dezenter Oliv-Verlauf im Card-Header (Rand + Innenabstand je nach Card-Größe). */
const ADMIN_LIST_CARD_HEADER_GRADIENT =
  "rounded-t-xl border-b border-primary/20 bg-gradient-to-b from-primary/[0.11] via-primary/[0.045] to-transparent pt-3 pb-2";

/** Für `Card size="sm"` (Aktuelles, Preise). */
const ADMIN_LIST_CARD_HEADER_CLASS = cn(
  ADMIN_LIST_CARD_HEADER_GRADIENT,
  "-mx-3 -mt-3 px-3",
);

/** Für normale `Card` im Kurse-Bereich (YogaFlow-Kurse, manuelle Kurse). */
const ADMIN_COURSE_CARD_HEADER_CLASS = cn(
  ADMIN_LIST_CARD_HEADER_GRADIENT,
  "-mx-4 -mt-4 px-4",
);

const LINK_TEXT_FALLBACK = "Linktext";
const MARKDOWN_HISTORY_LIMIT = 120;
const NEW_WINDOW_LINK_TITLE = "new-window";

const INTERNAL_ANCHOR_OPTIONS = [
  { href: "#hero", label: "Hero" },
  { href: "#aktuelles", label: "Aktuelles" },
  { href: "#kurse", label: "Kurse" },
  { href: "#preise", label: "Preise" },
  { href: "#ueber-mich", label: "Über mich" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

const VALID_INTERNAL_ANCHORS = new Set(INTERNAL_ANCHOR_OPTIONS.map((option) => option.href));
type InternalAnchorHref = (typeof INTERNAL_ANCHOR_OPTIONS)[number]["href"];

function isInternalAnchorHref(value: string): value is InternalAnchorHref {
  return VALID_INTERNAL_ANCHORS.has(value as InternalAnchorHref);
}

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

function parseMatchTitlesInput(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function yogaflowSeriesList(
  settings: SiteContent["settings"],
): YogaflowCourseSeries[] {
  return settings.yogaflowCourseSeries?.length
    ? settings.yogaflowCourseSeries
    : DEFAULT_YOGAFLOW_COURSE_SERIES;
}

function replaceCourseInDraft(
  prev: SiteContent,
  courseId: string,
  next: Course,
): SiteContent {
  return {
    ...prev,
    courses: prev.courses.map((c) => (c.id === courseId ? next : c)),
  };
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveAltFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aktuellImageUploadKey(itemId: string, slot: "mobile" | "desktop") {
  return `${itemId}__${slot}`;
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

/**
 * Vor dem Entfernen von Karten/Zeilen mit fokussierten Inputs: WebKit (v. a. iOS) kann sonst
 * einen weißen Vollbild-Glitch zeigen, bis der Nutzer erneut tippt.
 */
function blurActiveElementBeforeDomRemoval(): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}

function BookingBadgeLinkEditor({
  value,
  onChange,
  idPrefix,
}: {
  value: BookingBadgeLink | undefined;
  onChange: (next: BookingBadgeLink | undefined) => void;
  idPrefix: string;
}) {
  const enabled = value?.enabled === true;
  const kind = value?.kind ?? "url";
  const presetIds = useMemo(
    () => new Set(BOOKING_BADGE_ANCHOR_PRESETS.map((p) => p.value)),
    [],
  );
  const anchorRaw = (value?.anchor ?? "").trim().replace(/^#/, "");
  const anchorSelectValue = presetIds.has(anchorRaw) ? anchorRaw : "__custom__";

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            if (event.target.checked) {
              onChange({ enabled: true, kind: "url", url: "https://" });
            } else {
              onChange(undefined);
            }
          }}
        />
        <span>Pill als Link aktivieren</span>
      </label>
      {enabled ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-kind`}>Link-Art</Label>
            <select
              id={`${idPrefix}-kind`}
              className={adminSelectClass}
              value={kind}
              onChange={(event) => {
                const k = event.target.value as "url" | "anchor";
                if (k === "url") {
                  onChange({
                    enabled: true,
                    kind: "url",
                    url: value?.url?.trim() ? value.url : "https://",
                  });
                } else {
                  onChange({
                    enabled: true,
                    kind: "anchor",
                    anchor: presetIds.has(anchorRaw)
                      ? anchorRaw
                      : BOOKING_BADGE_ANCHOR_PRESETS[0]!.value,
                  });
                }
              }}
            >
              <option value="url">Normale URL (https:// …)</option>
              <option value="anchor">Anker auf der Startseite</option>
            </select>
          </div>
          {kind === "url" ? (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-url`}>URL</Label>
              <Input
                id={`${idPrefix}-url`}
                value={value?.url ?? ""}
                placeholder="https://…"
                onChange={(event) =>
                  onChange({
                    enabled: true,
                    kind: "url",
                    url: event.target.value,
                  })
                }
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-anchor-preset`}>Anker-Ziel</Label>
              <select
                id={`${idPrefix}-anchor-preset`}
                className={adminSelectClass}
                value={anchorSelectValue}
                onChange={(event) => {
                  const v = event.target.value;
                  if (v === "__custom__") {
                    onChange({
                      enabled: true,
                      kind: "anchor",
                      anchor: presetIds.has(anchorRaw) ? "" : anchorRaw,
                    });
                  } else {
                    onChange({ enabled: true, kind: "anchor", anchor: v });
                  }
                }}
              >
                {BOOKING_BADGE_ANCHOR_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="__custom__">Eigener Anker …</option>
              </select>
              {anchorSelectValue === "__custom__" ? (
                <Input
                  id={`${idPrefix}-anchor-custom`}
                  placeholder="z. B. kontakt"
                  value={anchorRaw}
                  onChange={(event) =>
                    onChange({
                      enabled: true,
                      kind: "anchor",
                      anchor: event.target.value.replace(/^#/, "").trim(),
                    })
                  }
                />
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Standard: Die Pill ist nicht anklickbar.
        </p>
      )}
    </div>
  );
}

function escapeMarkdownLinkText(rawText: string): string {
  return rawText.replaceAll("[", "\\[").replaceAll("]", "\\]");
}

/** `#kontakt` oder `/#kontakt` (Markdown-Links zur Startseite mit Anker). */
function anchorPathFromUrl(url: string): string | null {
  const t = url.trim();
  if (/^#[a-z0-9-]+$/i.test(t)) {
    return t;
  }
  if (/^\/#[a-z0-9-]+$/i.test(t)) {
    return t.slice(1);
  }
  return null;
}

function isValidEditorUrl(url: string): boolean {
  if (/^https?:\/\/\S+$/i.test(url)) {
    return true;
  }
  if (/^mailto:\S+@\S+\.\S+$/i.test(url)) {
    return true;
  }
  if (anchorPathFromUrl(url)) {
    return true;
  }
  return false;
}

function collectMarkdownLinkWarnings(markdown: string): string[] {
  const warnings = new Set<string>();
  const matches = markdown.matchAll(/\[[^\]]+\]\((\S+)(?:\s+"([^"]*)")?\)/g);
  for (const match of matches) {
    const href = match[1]?.trim();
    if (!href) {
      continue;
    }

    const anchor = anchorPathFromUrl(href);
    if (anchor) {
      if (!isInternalAnchorHref(anchor)) {
        warnings.add(
          `Unbekannter Anker-Link: "${href}". Erlaubt sind: ${Array.from(VALID_INTERNAL_ANCHORS).join(", ")} (auch als /#…).`,
        );
      }
      continue;
    }

    if (!/^https?:\/\/\S+$/i.test(href) && !/^mailto:\S+@\S+\.\S+$/i.test(href)) {
      warnings.add(`Ungültige Link-URL: "${href}". Erlaubt: https://, http://, mailto:, #anker oder /#anker.`);
    }
  }

  return Array.from(warnings);
}

type MarkdownLinkMatch = {
  start: number;
  end: number;
  text: string;
};

function getMarkdownLinkMatches(markdown: string): MarkdownLinkMatch[] {
  const matches: MarkdownLinkMatch[] = [];
  const regex = /\[([^\]]+)\]\((\S+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(regex)) {
    const raw = match[0];
    const text = match[1] ?? "";
    const index = match.index ?? -1;
    if (index < 0) {
      continue;
    }
    matches.push({
      start: index,
      end: index + raw.length,
      text,
    });
  }
  return matches;
}

function MarkdownEditor({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const historyPastRef = useRef<string[]>([]);
  const historyFutureRef = useRef<string[]>([]);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showLinkComposer, setShowLinkComposer] = useState(false);
  const [linkText, setLinkText] = useState(LINK_TEXT_FALLBACK);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkTarget, setLinkTarget] = useState<"self" | "blank">("self");
  const [linkInputError, setLinkInputError] = useState("");
  const [editorSelection, setEditorSelection] = useState({ start: 0, end: 0 });
  const linkSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const linkWarnings = useMemo(() => collectMarkdownLinkWarnings(value), [value]);
  const previewLines = useMemo(() => value.split("\n"), [value]);

  const applyValue = useCallback(
    (nextValue: string) => {
      if (nextValue === value) {
        return;
      }

      historyPastRef.current.push(value);
      if (historyPastRef.current.length > MARKDOWN_HISTORY_LIMIT) {
        historyPastRef.current.shift();
      }
      historyFutureRef.current = [];

      onChange(nextValue);
    },
    [onChange, value],
  );

  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return editorSelection;
    }
    if (document.activeElement === textarea) {
      return { start: textarea.selectionStart ?? 0, end: textarea.selectionEnd ?? 0 };
    }
    // When toolbar click blurs the textarea, fallback to last synced selection.
    return editorSelection;
  }, [editorSelection]);

  const syncEditorSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    setEditorSelection({
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0,
    });
  }, []);

  const focusSelection = useCallback((start: number, end: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }
      textarea.focus();
      textarea.setSelectionRange(start, end);
      setEditorSelection({ start, end });
    });
  }, []);

  const replaceRange = useCallback(
    (rangeStart: number, rangeEnd: number, nextText: string, selectStart: number, selectEnd: number) => {
      const nextValue = value.slice(0, rangeStart) + nextText + value.slice(rangeEnd);
      applyValue(nextValue);
      focusSelection(selectStart, selectEnd);
    },
    [applyValue, focusSelection, value],
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix = prefix, fallbackText = "Text") => {
      const { start, end } = getSelection();
      const selected = value.slice(start, end);
      const leadingWhitespace = selected.match(/^\s+/)?.[0] ?? "";
      const trailingWhitespace = selected.match(/\s+$/)?.[0] ?? "";
      const coreSelection = selected.slice(
        leadingWhitespace.length,
        Math.max(leadingWhitespace.length, selected.length - trailingWhitespace.length),
      );
      const baseText = coreSelection || fallbackText;

      const coreStart = start + leadingWhitespace.length;
      const coreEnd = end - trailingWhitespace.length;
      const hasPrefixBeforeSelection =
        coreStart >= prefix.length && value.slice(coreStart - prefix.length, coreStart) === prefix;
      const hasSuffixAfterSelection =
        suffix.length === 0 || value.slice(coreEnd, coreEnd + suffix.length) === suffix;

      // Toggle off when selection is already wrapped with the same markdown markers.
      if (coreSelection && hasPrefixBeforeSelection && hasSuffixAfterSelection) {
        const unwrapStart = coreStart - prefix.length;
        const unwrapEnd = coreEnd + suffix.length;
        const unwrapped = `${leadingWhitespace}${coreSelection}${trailingWhitespace}`;
        const nextSelectionStart = unwrapStart + leadingWhitespace.length;
        const nextSelectionEnd = nextSelectionStart + coreSelection.length;
        replaceRange(unwrapStart, unwrapEnd, unwrapped, nextSelectionStart, nextSelectionEnd);
        return;
      }

      const wrapped = `${leadingWhitespace}${prefix}${baseText}${suffix}${trailingWhitespace}`;
      const nextStart = start + leadingWhitespace.length + prefix.length;
      const nextEnd = nextStart + baseText.length;
      replaceRange(start, end, wrapped, nextStart, nextEnd);
    },
    [getSelection, replaceRange, value],
  );

  const toggleHeadingLine = useCallback(
    (prefix: "## " | "### ", fallbackText: string) => {
      const selection = getSelection();
      if (selection.start !== selection.end) {
        const selectedRaw = value.slice(selection.start, selection.end);
        const selectedTrimmed = selectedRaw.trim();
        const lineStartForSelection = value.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
        const lineEndIndexForSelection = value.indexOf("\n", selection.end);
        const lineEndForSelection = lineEndIndexForSelection === -1 ? value.length : lineEndIndexForSelection;
        const lineForSelection = value.slice(lineStartForSelection, lineEndForSelection);
        const isSingleLineSelection =
          value.lastIndexOf("\n", Math.max(0, selection.end - 1)) < selection.start;
        const isSelectionInsideMatchingHeadingLine =
          isSingleLineSelection &&
          lineForSelection.startsWith(prefix) &&
          lineForSelection.slice(prefix.length).trim() === selectedTrimmed;

        if (isSelectionInsideMatchingHeadingLine) {
          replaceRange(
            lineStartForSelection,
            lineEndForSelection,
            selectedTrimmed,
            lineStartForSelection,
            lineStartForSelection + selectedTrimmed.length,
          );
          return;
        }

        const hasPrefix = selectedTrimmed.startsWith(prefix);
        const replacementCore = hasPrefix
          ? selectedTrimmed.slice(prefix.length)
          : `${prefix}${selectedTrimmed || fallbackText}`;
        const needsLeadingBreak = selection.start > 0 && value[selection.start - 1] !== "\n";
        const needsTrailingBreak = selection.end < value.length && value[selection.end] !== "\n";
        const replacement = `${needsLeadingBreak ? "\n" : ""}${replacementCore}${needsTrailingBreak ? "\n" : ""}`;
        const selectionOffset = (needsLeadingBreak ? 1 : 0) + (hasPrefix ? 0 : prefix.length);
        const nextSelectionStart = selection.start + selectionOffset;
        const nextSelectionEnd = nextSelectionStart + (hasPrefix ? replacementCore.length : selectedTrimmed.length);

        replaceRange(
          selection.start,
          selection.end,
          replacement,
          nextSelectionStart,
          Math.max(nextSelectionStart, nextSelectionEnd),
        );
        return;
      }

      const lineStart = value.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
      const lineEndIndex = value.indexOf("\n", selection.end);
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
      const line = value.slice(lineStart, lineEnd);
      const hasPrefix = line.startsWith(prefix);
      const nextLine = hasPrefix ? line.slice(prefix.length) : `${prefix}${line.trim() || fallbackText}`;
      const nextCursor = hasPrefix
        ? Math.max(lineStart, selection.start - prefix.length)
        : selection.start + prefix.length;
      replaceRange(lineStart, lineEnd, nextLine, nextCursor, nextCursor);
    },
    [getSelection, replaceRange, value],
  );

  const toggleListLines = useCallback(
    (mode: "bullet" | "ordered") => {
      const selection = getSelection();
      const startLine = value.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
      const lineEndIndex = value.indexOf("\n", selection.end);
      const endLine = lineEndIndex === -1 ? value.length : lineEndIndex;
      const block = value.slice(startLine, endLine);
      const lines = block.split("\n");

      const transformed = lines.map((line, index) => {
        if (mode === "bullet") {
          return line.startsWith("- ") ? line.slice(2) : `- ${line}`;
        }
        return /^\d+\.\s/.test(line) ? line.replace(/^\d+\.\s/, "") : `${index + 1}. ${line}`;
      });

      const nextBlock = transformed.join("\n");
      replaceRange(startLine, endLine, nextBlock, selection.start, selection.start);
    },
    [getSelection, replaceRange, value],
  );

  const insertAnchorLink = useCallback((href: (typeof INTERNAL_ANCHOR_OPTIONS)[number]["href"]) => {
    const { start, end } = getSelection();
    const selected = value.slice(start, end).trim();
    const text = selected || LINK_TEXT_FALLBACK;
    const markdownLink = `[${escapeMarkdownLinkText(text)}](${href})`;
    const nextSelectionStart = start + 1;
    const nextSelectionEnd = nextSelectionStart + text.length;
    replaceRange(start, end, markdownLink, nextSelectionStart, nextSelectionEnd);
    setIsMoreMenuOpen(false);
  }, [getSelection, replaceRange, value]);

  const openLinkComposer = useCallback(() => {
    const { start, end } = getSelection();
    const selected = value.slice(start, end).trim();
    linkSelectionRef.current = { start, end };
    setLinkText(selected || LINK_TEXT_FALLBACK);
    setLinkUrl("https://");
    setLinkTarget("self");
    setLinkInputError("");
    setShowLinkComposer(true);
  }, [getSelection, value]);

  const insertCustomLink = useCallback(() => {
    const trimmedUrl = linkUrl.trim();
    if (!isValidEditorUrl(trimmedUrl)) {
      setLinkInputError("Ungültige URL. Erlaubt: https://, http://, mailto:, #anker oder /#anker.");
      return;
    }
    const anchorForComposer = anchorPathFromUrl(trimmedUrl);
    if (anchorForComposer) {
      if (!isInternalAnchorHref(anchorForComposer)) {
        setLinkInputError(`Unbekannter Anker: ${trimmedUrl}`);
        return;
      }
      if (linkTarget === "blank") {
        setLinkInputError("Anker-Links öffnen immer im gleichen Fenster.");
        return;
      }
    }

    const safeText = escapeMarkdownLinkText(linkText.trim() || LINK_TEXT_FALLBACK);
    const titleToken = linkTarget === "blank" ? ` "${NEW_WINDOW_LINK_TITLE}"` : "";
    const markdownLink = `[${safeText}](${trimmedUrl}${titleToken})`;
    const { start, end } = linkSelectionRef.current;
    const nextSelectionStart = start + 1;
    const nextSelectionEnd = nextSelectionStart + safeText.length;
    replaceRange(start, end, markdownLink, nextSelectionStart, nextSelectionEnd);
    setShowLinkComposer(false);
    setLinkInputError("");
  }, [linkTarget, linkText, linkUrl, replaceRange]);

  const removeLinkFormatting = useCallback(() => {
    const selection = getSelection();
    const matches = getMarkdownLinkMatches(value);

    if (selection.start === selection.end) {
      const containingMatch = matches.find(
        (match) => selection.start >= match.start && selection.start <= match.end,
      );
      if (!containingMatch) {
        return;
      }
      replaceRange(
        containingMatch.start,
        containingMatch.end,
        containingMatch.text,
        containingMatch.start,
        containingMatch.start + containingMatch.text.length,
      );
      return;
    }

    const overlappingMatches = matches.filter(
      (match) => match.end > selection.start && match.start < selection.end,
    );
    if (overlappingMatches.length === 0) {
      return;
    }

    let nextValue = value;
    let offset = 0;
    for (const match of overlappingMatches) {
      const start = match.start + offset;
      const end = match.end + offset;
      nextValue = nextValue.slice(0, start) + match.text + nextValue.slice(end);
      offset += match.text.length - (match.end - match.start);
    }

    applyValue(nextValue);
    focusSelection(selection.start, selection.start);
  }, [applyValue, focusSelection, getSelection, replaceRange, value]);

  const handleUndo = useCallback(() => {
    const previousValue = historyPastRef.current.pop();
    if (previousValue === undefined) {
      return;
    }
    historyFutureRef.current.push(value);
    onChange(previousValue);
  }, [onChange, value]);

  const handleRedo = useCallback(() => {
    const futureValue = historyFutureRef.current.pop();
    if (futureValue === undefined) {
      return;
    }
    historyPastRef.current.push(value);
    onChange(futureValue);
  }, [onChange, value]);

  const handleTextareaChange = useCallback(
    (nextValue: string) => {
      applyValue(nextValue);
      syncEditorSelection();
    },
    [applyValue, syncEditorSelection],
  );

  const handleEditorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const isModKey = event.ctrlKey || event.metaKey;
      if (!isModKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        wrapSelection("**");
        return;
      }
      if (key === "i") {
        event.preventDefault();
        wrapSelection("*");
        return;
      }
      if (key === "k") {
        event.preventDefault();
        openLinkComposer();
        return;
      }
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    },
    [handleRedo, handleUndo, openLinkComposer, wrapSelection],
  );

  useEffect(() => {
    if (!isMoreMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !moreMenuRef.current?.contains(target)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isMoreMenuOpen]);

  const handleMoreButtonClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsMoreMenuOpen((current) => !current);
  }, []);

  const keepSelectionOnToolbarMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
    },
    [],
  );

  const currentLine = useMemo(() => {
    const caret = editorSelection.start;
    const lineStart = value.lastIndexOf("\n", Math.max(0, caret - 1)) + 1;
    const lineEndIndex = value.indexOf("\n", caret);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    return value.slice(lineStart, lineEnd);
  }, [editorSelection.start, value]);

  const isH2Active = currentLine.startsWith("## ");
  const isH3Active = currentLine.startsWith("### ");
  const isBulletListActive = currentLine.startsWith("- ");
  const isOrderedListActive = /^\d+\.\s/.test(currentLine);
  const isLinkActive = useMemo(() => {
    const matches = getMarkdownLinkMatches(value);
    const caret = editorSelection.start;
    if (editorSelection.start === editorSelection.end) {
      return matches.some((match) => caret >= match.start && caret <= match.end);
    }
    return matches.some((match) => match.end > editorSelection.start && match.start < editorSelection.end);
  }, [editorSelection.end, editorSelection.start, value]);

  const isWrappedSelectionActive = useCallback(
    (prefix: string, suffix = prefix) => {
      if (editorSelection.start === editorSelection.end) {
        return false;
      }
      const selected = value.slice(editorSelection.start, editorSelection.end);
      const leadingWhitespace = selected.match(/^\s+/)?.[0] ?? "";
      const trailingWhitespace = selected.match(/\s+$/)?.[0] ?? "";
      const coreSelection = selected.slice(
        leadingWhitespace.length,
        Math.max(leadingWhitespace.length, selected.length - trailingWhitespace.length),
      );
      if (!coreSelection) {
        return false;
      }
      const coreStart = editorSelection.start + leadingWhitespace.length;
      const coreEnd = editorSelection.end - trailingWhitespace.length;
      const hasPrefix =
        coreStart >= prefix.length && value.slice(coreStart - prefix.length, coreStart) === prefix;
      const hasSuffix = suffix.length === 0 || value.slice(coreEnd, coreEnd + suffix.length) === suffix;
      return hasPrefix && hasSuffix;
    },
    [editorSelection.end, editorSelection.start, value],
  );

  const isBoldActive = isWrappedSelectionActive("**");
  const isItalicActive = useMemo(() => {
    if (editorSelection.start === editorSelection.end) {
      return false;
    }
    const selected = value.slice(editorSelection.start, editorSelection.end);
    const leadingWhitespace = selected.match(/^\s+/)?.[0] ?? "";
    const trailingWhitespace = selected.match(/\s+$/)?.[0] ?? "";
    const coreSelection = selected.slice(
      leadingWhitespace.length,
      Math.max(leadingWhitespace.length, selected.length - trailingWhitespace.length),
    );
    if (!coreSelection) {
      return false;
    }
    const coreStart = editorSelection.start + leadingWhitespace.length;
    const coreEnd = editorSelection.end - trailingWhitespace.length;
    const hasSingleStarPrefix = coreStart >= 1 && value.slice(coreStart - 1, coreStart) === "*";
    const hasSingleStarSuffix = value.slice(coreEnd, coreEnd + 1) === "*";
    const hasBoldPrefix =
      coreStart >= 2 && value.slice(coreStart - 2, coreStart) === "**";
    const hasBoldSuffix = value.slice(coreEnd, coreEnd + 2) === "**";
    return hasSingleStarPrefix && hasSingleStarSuffix && !hasBoldPrefix && !hasBoldSuffix;
  }, [editorSelection.end, editorSelection.start, value]);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="rounded-lg border border-border bg-background p-2">
        <div className="flex w-full items-center gap-1.5 border-b border-border pb-2">
          <Button
            type="button"
            variant={isBoldActive ? "default" : "outline"}
            size="sm"
            className="h-9 flex-1 px-0 md:h-8 md:flex-none md:px-2.5"
            onMouseDown={keepSelectionOnToolbarMouseDown}
            onClick={() => wrapSelection("**")}
            title="Fett (Ctrl/Cmd+B)"
          >
            Fett
          </Button>
          <Button
            type="button"
            variant={isItalicActive ? "default" : "outline"}
            size="sm"
            className="h-9 flex-1 px-0 md:h-8 md:flex-none md:px-2.5"
            onMouseDown={keepSelectionOnToolbarMouseDown}
            onClick={() => wrapSelection("*")}
            title="Kursiv (Ctrl/Cmd+I)"
          >
            Kursiv
          </Button>
          <Button
            type="button"
            variant={isH2Active ? "default" : "outline"}
            size="sm"
            className="h-9 flex-1 px-0 md:h-8 md:flex-none md:px-2.5"
            onMouseDown={keepSelectionOnToolbarMouseDown}
            onClick={() => toggleHeadingLine("## ", "Überschrift")}
            title="Überschrift H2"
          >
            H2
          </Button>
          <Button
            type="button"
            variant={isBulletListActive ? "default" : "outline"}
            size="sm"
            className="h-9 flex-1 px-0 md:h-8 md:flex-none md:px-2.5"
            onMouseDown={keepSelectionOnToolbarMouseDown}
            onClick={() => toggleListLines("bullet")}
            title="Liste"
          >
            Liste
          </Button>
          <Button
            type="button"
            variant={isLinkActive ? "default" : "outline"}
            size="sm"
            className="h-9 flex-1 px-0 md:h-8 md:flex-none md:px-2.5"
            onMouseDown={keepSelectionOnToolbarMouseDown}
            onClick={openLinkComposer}
            title="Link (Ctrl/Cmd+K)"
          >
            Link
          </Button>
          <div className="hidden h-5 w-px shrink-0 bg-border/80 md:block" />
          <div ref={moreMenuRef} className="relative shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-11 px-0 md:h-8 md:w-auto md:px-2.5"
              onMouseDown={keepSelectionOnToolbarMouseDown}
              onClick={handleMoreButtonClick}
              title="Mehr Optionen"
              aria-expanded={isMoreMenuOpen}
            >
              Mehr
            </Button>
            {isMoreMenuOpen ? (
              <div className="absolute top-9 right-0 z-20 w-48 space-y-1 rounded-md border border-border bg-popover p-2 shadow-lg">
                <button
                  type="button"
                  className={`inline-flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${isH3Active ? "bg-muted" : ""}`}
                  onMouseDown={keepSelectionOnToolbarMouseDown}
                  onClick={() => {
                    toggleHeadingLine("### ", "Unterüberschrift");
                    setIsMoreMenuOpen(false);
                  }}
                >
                  <Heading3 className="size-4" />
                  Überschrift H3
                </button>
                <button
                  type="button"
                  className={`inline-flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${isOrderedListActive ? "bg-muted" : ""}`}
                  onMouseDown={keepSelectionOnToolbarMouseDown}
                  onClick={() => {
                    toggleListLines("ordered");
                    setIsMoreMenuOpen(false);
                  }}
                >
                  <ListOrdered className="size-4" />
                  Nummerierte Liste
                </button>
                <p className="px-2 pt-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Anker-Links
                </p>
                {INTERNAL_ANCHOR_OPTIONS.map((option) => (
                  <button
                    key={option.href}
                    type="button"
                    className="inline-flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                    onMouseDown={keepSelectionOnToolbarMouseDown}
                    onClick={() => insertAnchorLink(option.href)}
                  >
                    <Link2 className="size-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {showLinkComposer ? (
          <div className="mt-2 grid gap-2 rounded-md border border-border bg-muted/30 p-2 md:grid-cols-[1fr_1fr_auto_auto]">
            <Input value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="Linktext" />
            <Input
              value={linkUrl}
              onChange={(event) => {
                setLinkUrl(event.target.value);
                setLinkInputError("");
              }}
              placeholder="https://..., mailto:..., #kontakt"
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={linkTarget}
              onChange={(event) => {
                setLinkTarget(event.target.value === "blank" ? "blank" : "self");
                setLinkInputError("");
              }}
            >
              <option value="self">Im gleichen Fenster</option>
              <option value="blank">In neuem Fenster</option>
            </select>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={insertCustomLink}>
                Link einfügen
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  removeLinkFormatting();
                  setShowLinkComposer(false);
                  setLinkTarget("self");
                  setLinkInputError("");
                }}
              >
                Link entfernen
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowLinkComposer(false);
                  setLinkTarget("self");
                  setLinkInputError("");
                }}
              >
                Abbrechen
              </Button>
            </div>
            {linkInputError ? <p className="text-xs text-destructive md:col-span-3">{linkInputError}</p> : null}
          </div>
        ) : null}

        <div className="mt-2 space-y-2">
          <Textarea
            ref={textareaRef}
            value={value}
            placeholder={placeholder}
            onChange={(event) => handleTextareaChange(event.target.value)}
            onKeyDown={handleEditorKeyDown}
            onSelect={syncEditorSelection}
            onClick={syncEditorSelection}
            onKeyUp={syncEditorSelection}
            onFocus={syncEditorSelection}
            rows={rows}
          />
          <p className="text-xs text-muted-foreground">
            Kürzel: Ctrl/Cmd+B (fett), Ctrl/Cmd+I (kursiv), Ctrl/Cmd+K (Link), Ctrl/Cmd+Z/Y
          </p>
          {linkWarnings.length > 0 ? (
            <div className="space-y-1 rounded-md border border-amber-300/60 bg-amber-50/70 p-2 text-xs text-amber-900">
              {linkWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Vorschau
        </p>
        <div className="max-w-none space-y-0 text-base leading-normal text-foreground md:text-sm">
          {previewLines.map((line, index) =>
            line.length === 0 ? (
              <div key={`empty-${index}`} className="h-[1.45em]" aria-hidden />
            ) : (
              <ReactMarkdown
                key={`line-${index}`}
                remarkPlugins={[remarkBreaks]}
                components={{
                  h2: ({ children, ...props }) => (
                    <h2 className="m-0 text-xl font-bold tracking-tight text-foreground" {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className="m-0 text-lg font-semibold tracking-tight text-foreground" {...props}>
                      {children}
                    </h3>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className="m-0 list-disc pl-6" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="m-0 list-decimal pl-6" {...props}>
                      {children}
                    </ol>
                  ),
                  p: ({ children, ...props }) => (
                    <p className="m-0 text-foreground whitespace-break-spaces" {...props}>
                      {children}
                    </p>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="m-0 text-foreground whitespace-break-spaces" {...props}>
                      {children}
                    </li>
                  ),
                  a: ({ title, ...props }) => {
                    const openInNewTab = title === NEW_WINDOW_LINK_TITLE;
                    return (
                      <a
                        {...props}
                        title={openInNewTab ? undefined : title}
                        target={openInNewTab ? "_blank" : undefined}
                        rel={openInNewTab ? "noopener noreferrer" : undefined}
                      />
                    );
                  },
                }}
              >
                {line}
              </ReactMarkdown>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ initialContent, saveAction }: AdminDashboardProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteContent>(() =>
    disconnectSiteContentObjectGraph(initialContent),
  );
  const [activeSection, setActiveSection] = useState<SectionKey>("hero");
  const [saveState, saveFormAction, savePending] = useActionState(saveAction, {});
  const [sectionTabsTop, setSectionTabsTop] = useState(104);
  const [uploadingAktuellKey, setUploadingAktuellKey] = useState<Record<string, boolean>>({});
  const [uploadErrorAktuellById, setUploadErrorAktuellById] = useState<Record<string, string>>({});
  const [selectedAktuellFileByKey, setSelectedAktuellFileByKey] = useState<Record<string, string>>({});
  const aktuellFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingAboutSlot, setUploadingAboutSlot] = useState<"mobile" | "desktop" | null>(null);
  const [uploadErrorAbout, setUploadErrorAbout] = useState("");
  const [selectedAboutFileNameMobile, setSelectedAboutFileNameMobile] = useState("");
  const [selectedAboutFileNameDesktop, setSelectedAboutFileNameDesktop] = useState("");
  const aboutImageMobileFileInputRef = useRef<HTMLInputElement | null>(null);
  const aboutImageDesktopFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingHeroSlot, setUploadingHeroSlot] = useState<"mobile" | "desktop" | null>(null);
  const [uploadErrorHero, setUploadErrorHero] = useState("");
  const [selectedHeroFileNameMobile, setSelectedHeroFileNameMobile] = useState("");
  const [selectedHeroFileNameDesktop, setSelectedHeroFileNameDesktop] = useState("");
  const heroImageMobileFileInputRef = useRef<HTMLInputElement | null>(null);
  const heroImageDesktopFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingOgSlot, setUploadingOgSlot] = useState<"mobile" | "desktop" | null>(null);
  const [uploadErrorOg, setUploadErrorOg] = useState("");
  const [selectedOgFileNameMobile, setSelectedOgFileNameMobile] = useState("");
  const [selectedOgFileNameDesktop, setSelectedOgFileNameDesktop] = useState("");
  const ogImageMobileFileInputRef = useRef<HTMLInputElement | null>(null);
  const ogImageDesktopFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingLogoSlot, setUploadingLogoSlot] = useState<"mobile" | "desktop" | null>(null);
  const [uploadErrorLogo, setUploadErrorLogo] = useState("");
  const [selectedLogoFileNameMobile, setSelectedLogoFileNameMobile] = useState("");
  const [selectedLogoFileNameDesktop, setSelectedLogoFileNameDesktop] = useState("");
  const logoImageMobileFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoImageDesktopFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadErrorFavicon, setUploadErrorFavicon] = useState("");
  const [selectedFaviconFileName, setSelectedFaviconFileName] = useState("");
  const faviconFileInputRef = useRef<HTMLInputElement | null>(null);

  const [mobileSaveHost, setMobileSaveHost] = useState<HTMLElement | null>(null);
  const [saveToast, setSaveToast] = useState<{ text: string; isError: boolean } | null>(null);
  const [desktopSaveFeedbackShow, setDesktopSaveFeedbackShow] = useState(false);
  const [desktopSaveFeedbackFadeOut, setDesktopSaveFeedbackFadeOut] = useState(false);
  const desktopSaveFeedbackTimersRef = useRef<{
    toFade: ReturnType<typeof setTimeout> | null;
    toUnmount: ReturnType<typeof setTimeout> | null;
  }>({ toFade: null, toUnmount: null });

  const serializedContent = useMemo(() => JSON.stringify(draft), [draft]);
  const logoEnabled = draft.settings.logoEnabled !== false;
  const wordmarkEnabled = draft.settings.wordmarkEnabled !== false;
  const canDisableLogo = wordmarkEnabled;
  const canDisableWordmark = logoEnabled;

  useEffect(() => {
    setMobileSaveHost(document.getElementById(ADMIN_MOBILE_SAVE_PORTAL_ID));
  }, []);

  useEffect(() => {
    const clearDesktopFeedbackTimers = () => {
      if (desktopSaveFeedbackTimersRef.current.toFade) {
        clearTimeout(desktopSaveFeedbackTimersRef.current.toFade);
        desktopSaveFeedbackTimersRef.current.toFade = null;
      }
      if (desktopSaveFeedbackTimersRef.current.toUnmount) {
        clearTimeout(desktopSaveFeedbackTimersRef.current.toUnmount);
        desktopSaveFeedbackTimersRef.current.toUnmount = null;
      }
    };

    clearDesktopFeedbackTimers();

    if (!saveState.message && !saveState.error) {
      setDesktopSaveFeedbackShow(false);
      setDesktopSaveFeedbackFadeOut(false);
      return;
    }

    setDesktopSaveFeedbackShow(true);
    setDesktopSaveFeedbackFadeOut(false);

    desktopSaveFeedbackTimersRef.current.toFade = setTimeout(() => {
      setDesktopSaveFeedbackFadeOut(true);
      desktopSaveFeedbackTimersRef.current.toUnmount = setTimeout(() => {
        setDesktopSaveFeedbackShow(false);
        setDesktopSaveFeedbackFadeOut(false);
        desktopSaveFeedbackTimersRef.current.toUnmount = null;
      }, DESKTOP_SAVE_FEEDBACK_FADE_MS);
      desktopSaveFeedbackTimersRef.current.toFade = null;
    }, DESKTOP_SAVE_FEEDBACK_VISIBLE_MS);

    return clearDesktopFeedbackTimers;
  }, [saveState.message, saveState.error]);

  useEffect(() => {
    if (saveState.message) {
      setSaveToast({ text: saveState.message, isError: false });
      router.refresh();
      return;
    }
    if (saveState.error) {
      setSaveToast({ text: saveState.error, isError: true });
    }
  }, [saveState.message, saveState.error, router]);

  useEffect(() => {
    if (!saveToast) {
      return;
    }
    const durationMs = saveToast.isError ? 4000 : 2600;
    const timer = window.setTimeout(() => setSaveToast(null), durationMs);
    return () => window.clearTimeout(timer);
  }, [saveToast]);

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

  const uploadAktuellImage = async (itemId: string, slot: "mobile" | "desktop", file: File) => {
    const uKey = aktuellImageUploadKey(itemId, slot);
    setUploadingAktuellKey((prev) => ({ ...prev, [uKey]: true }));
    setUploadErrorAktuellById((prev) => ({ ...prev, [itemId]: "" }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "aktuelles");

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
                    [slot]: { url: data.url! },
                    alt: current.image.alt.trim()
                      ? current.image.alt
                      : deriveAltFromFilename(file.name),
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
      setUploadingAktuellKey((prev) => ({ ...prev, [uKey]: false }));
    }
  };

  const uploadAboutImage = async (slot: "mobile" | "desktop", file: File) => {
    setUploadingAboutSlot(slot);
    setUploadErrorAbout("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "about");

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
        about: {
          ...prev.about,
          image: {
            ...prev.about.image,
            [slot]: { url: data.url! },
            alt: prev.about.image.alt.trim()
              ? prev.about.image.alt
              : deriveAltFromFilename(file.name),
          },
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
      setUploadErrorAbout(message);
    } finally {
      setUploadingAboutSlot(null);
    }
  };

  const uploadHeroBackground = async (slot: "mobile" | "desktop", file: File) => {
    setUploadingHeroSlot(slot);
    setUploadErrorHero("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "hero");

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
        hero: {
          ...prev.hero,
          backgroundImage: {
            ...prev.hero.backgroundImage,
            [slot]: { url: data.url! },
            alt: prev.hero.backgroundImage.alt.trim()
              ? prev.hero.backgroundImage.alt
              : deriveAltFromFilename(file.name),
          },
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
      setUploadErrorHero(message);
    } finally {
      setUploadingHeroSlot(null);
    }
  };

  const uploadOgImage = async (slot: "mobile" | "desktop", file: File) => {
    setUploadingOgSlot(slot);
    setUploadErrorOg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "og");

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

      setDraft((prev) => {
        const prevOg = prev.settings.ogImage ?? { mobile: { url: "" }, desktop: { url: "" } };
        return {
          ...prev,
          settings: {
            ...prev.settings,
            ogImage: {
              mobile: { url: slot === "mobile" ? data.url! : prevOg.mobile.url },
              desktop: { url: slot === "desktop" ? data.url! : prevOg.desktop.url },
            },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
      setUploadErrorOg(message);
    } finally {
      setUploadingOgSlot(null);
    }
  };

  const uploadLogoImage = async (slot: "mobile" | "desktop", file: File) => {
    setUploadingLogoSlot(slot);
    setUploadErrorLogo("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "logo");

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

      setDraft((prev) => {
        const prevLogo = prev.settings.logo ?? { mobile: { url: "" }, desktop: { url: "" } };
        return {
          ...prev,
          settings: {
            ...prev.settings,
            logo: {
              mobile: { url: slot === "mobile" ? data.url! : prevLogo.mobile.url },
              desktop: { url: slot === "desktop" ? data.url! : prevLogo.desktop.url },
            },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
      setUploadErrorLogo(message);
    } finally {
      setUploadingLogoSlot(null);
    }
  };

  const uploadFaviconImage = async (file: File) => {
    setUploadingFavicon(true);
    setUploadErrorFavicon("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "favicon");

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
        settings: { ...prev.settings, faviconUrl: data.url! },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
      setUploadErrorFavicon(message);
    } finally {
      setUploadingFavicon(false);
    }
  };

  const mobileSaveButton =
    mobileSaveHost &&
    createPortal(
      <Button
        type="submit"
        form={ADMIN_SITE_CONTENT_FORM_ID}
        disabled={savePending}
        className="h-9 w-full text-sm font-medium"
      >
        {savePending ? "Speichern..." : "Änderungen speichern"}
      </Button>,
      mobileSaveHost,
    );

  return (
    <div className="space-y-6">
      {mobileSaveButton}

      {saveToast ? (
        <div
          className="md:hidden pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-center text-sm shadow-lg backdrop-blur-md",
              saveToast.isError
                ? "border-destructive/40 bg-background/95 text-destructive"
                : "border-primary/40 bg-background/95 text-primary",
            )}
          >
            {saveToast.text}
          </div>
        </div>
      ) : null}

      <div className="sticky z-30" style={{ top: `${sectionTabsTop}px` }}>
        <div className="-mx-4 border-b border-border/80 bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
            <div
              className="hide-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none"
              style={{ touchAction: "pan-x" }}
            >
              <div className="flex w-max min-w-full gap-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    type="button"
                    variant={activeSection === section.id ? "default" : "outline"}
                    size="default"
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="hidden min-w-0 shrink-0 flex-row items-center gap-3 md:flex">
              {desktopSaveFeedbackShow && (saveState.message || saveState.error) ? (
                <div
                  className={cn(
                    "min-w-0 max-w-[min(20rem,42vw)] space-y-0.5 transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    desktopSaveFeedbackFadeOut ? "opacity-0" : "opacity-100",
                  )}
                >
                  {saveState.message ? (
                    <p className="text-sm leading-snug text-primary">{saveState.message}</p>
                  ) : null}
                  {saveState.error ? (
                    <p className="text-sm leading-snug text-destructive">{saveState.error}</p>
                  ) : null}
                </div>
              ) : null}
              <Button
                type="submit"
                form={ADMIN_SITE_CONTENT_FORM_ID}
                disabled={savePending}
                className="shrink-0"
              >
                {savePending ? "Speichern..." : "Änderungen speichern"}
              </Button>
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
          <form id={ADMIN_SITE_CONTENT_FORM_ID} action={saveFormAction} className="space-y-5">
            <input type="hidden" name="content" value={serializedContent} />

            {activeSection === "hero" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Hero Label anzeigen</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.settings.heroEyebrowEnabled !== false}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, heroEyebrowEnabled: event.target.checked },
                        }))
                      }
                    />
                    <span>Kleine Zeile über dem Hero-Titel anzeigen</span>
                  </label>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Hero Label (kleine Zeile)</Label>
                  <Input
                    value={draft.settings.sectionEyebrows?.hero ?? ""}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          sectionEyebrows: {
                            ...prev.settings.sectionEyebrows,
                            hero: event.target.value || undefined,
                          },
                        },
                      }))
                    }
                  />
                </div>
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
                    rows={4}
                    value={draft.hero.claim}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, hero: { ...prev.hero, claim: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hero-image-alt">Hero-Bild Alt-Text</Label>
                  <Input
                    id="hero-image-alt"
                    value={draft.hero.backgroundImage.alt}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        hero: {
                          ...prev.hero,
                          backgroundImage: { ...prev.hero.backgroundImage, alt: event.target.value },
                        },
                      }))
                    }
                  />
                  <p className="text-muted-foreground text-sm">
                    Kurzbeschreibung des Hero-Fotos für Screenreader und Suchmaschinen (Pflichtfeld).
                  </p>
                </div>
                <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <AdminImageFieldLabel variant="heroMobile" htmlFor="hero-bg-mobile-url">
                      Hero Bild-URL (Mobil)
                    </AdminImageFieldLabel>
                    <Input
                      id="hero-bg-mobile-url"
                      value={draft.hero.backgroundImage.mobile.url}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          hero: {
                            ...prev.hero,
                            backgroundImage: {
                              ...prev.hero.backgroundImage,
                              mobile: { url: event.target.value },
                            },
                          },
                        }))
                      }
                    />
                    <AdminImageFieldLabel variant="heroMobile">Mobil hochladen</AdminImageFieldLabel>
                    <input
                      ref={heroImageMobileFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingHeroSlot !== null}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        setSelectedHeroFileNameMobile(file.name);
                        await uploadHeroBackground("mobile", file);
                        event.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-primary/40 bg-primary/5 text-primary"
                        disabled={uploadingHeroSlot !== null}
                        onClick={() => heroImageMobileFileInputRef.current?.click()}
                      >
                        Datei auswählen
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedHeroFileNameMobile || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AdminImageFieldLabel variant="heroDesktop" htmlFor="hero-bg-desktop-url">
                      Hero Bild-URL (Desktop)
                    </AdminImageFieldLabel>
                    <Input
                      id="hero-bg-desktop-url"
                      value={draft.hero.backgroundImage.desktop.url}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          hero: {
                            ...prev.hero,
                            backgroundImage: {
                              ...prev.hero.backgroundImage,
                              desktop: { url: event.target.value },
                            },
                          },
                        }))
                      }
                    />
                    <AdminImageFieldLabel variant="heroDesktop">Desktop hochladen</AdminImageFieldLabel>
                    <input
                      ref={heroImageDesktopFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingHeroSlot !== null}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        setSelectedHeroFileNameDesktop(file.name);
                        await uploadHeroBackground("desktop", file);
                        event.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-primary/40 bg-primary/5 text-primary"
                        disabled={uploadingHeroSlot !== null}
                        onClick={() => heroImageDesktopFileInputRef.current?.click()}
                      >
                        Datei auswählen
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedHeroFileNameDesktop || "—"}
                      </span>
                    </div>
                  </div>
                </div>
                {uploadingHeroSlot ? (
                  <p className="text-muted-foreground text-xs md:col-span-2">Upload läuft…</p>
                ) : null}
                {uploadErrorHero ? (
                  <p className="text-destructive text-xs md:col-span-2">{uploadErrorHero}</p>
                ) : null}
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
                    <Label>Aktuelles Label anzeigen</Label>
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.settings.aktuellEyebrowEnabled !== false}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, aktuellEyebrowEnabled: event.target.checked },
                          }))
                        }
                      />
                      <span>Kleine Zeile anzeigen</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>Aktuelles Label (kleine Zeile)</Label>
                    <Input
                      value={draft.settings.sectionEyebrows?.aktuell ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              aktuell: event.target.value || undefined,
                            },
                          },
                        }))
                      }
                    />
                  </div>
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
                                image: { alt: "", mobile: { url: "" }, desktop: { url: "" } },
                                cta: { enabled: false },
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
                        <CardHeader className={ADMIN_LIST_CARD_HEADER_CLASS}>
                          <CardTitle className="pl-2 text-sm font-bold leading-none">
                            Card {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2 md:items-start">
                            <div className="space-y-2">
                              <div className="flex min-h-7 items-center">
                                <Label>ID</Label>
                              </div>
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
                              <AdminSortOrderLabelRow htmlFor={`aktuell-sort-${item.id}`} />
                              <Input
                                id={`aktuell-sort-${item.id}`}
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
                          <div className="space-y-2">
                            <Label htmlFor={`aktuell-badge-${item.id}`}>
                              Badge auf dem Bild
                            </Label>
                            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 text-sm">
                              <input
                                type="checkbox"
                                checked={item.badgeEnabled !== false}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? { ...current, badgeEnabled: event.target.checked }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                              <span>Badge anzeigen</span>
                            </label>
                            <Input
                              id={`aktuell-badge-${item.id}`}
                              placeholder="Leer = automatisch (Aktuell / Workshop)"
                              value={item.badgeLabel ?? ""}
                              maxLength={40}
                              onChange={(event) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  aktuell: {
                                    ...prev.aktuell,
                                    items: prev.aktuell.items.map((current) =>
                                      current.id === item.id
                                        ? {
                                            ...current,
                                            badgeLabel: event.target.value.trim()
                                              ? event.target.value.trim()
                                              : undefined,
                                          }
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
                          <div className="grid gap-3 md:grid-cols-2 md:items-start">
                            <div className="space-y-2 md:col-span-2">
                              <AdminImageFieldLabel
                                variant="aktuellMobile"
                                htmlFor={`aktuell-image-mobile-url-${item.id}`}
                              >
                                Bild-URL (Mobil)
                              </AdminImageFieldLabel>
                              <Input
                                id={`aktuell-image-mobile-url-${item.id}`}
                                value={item.image.mobile.url}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? {
                                              ...current,
                                              image: {
                                                ...current.image,
                                                mobile: { url: event.target.value },
                                              },
                                            }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <AdminImageFieldLabel
                                variant="aktuellDesktop"
                                htmlFor={`aktuell-image-desktop-url-${item.id}`}
                              >
                                Bild-URL (Desktop)
                              </AdminImageFieldLabel>
                              <Input
                                id={`aktuell-image-desktop-url-${item.id}`}
                                value={item.image.desktop.url}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? {
                                              ...current,
                                              image: {
                                                ...current.image,
                                                desktop: { url: event.target.value },
                                              },
                                            }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <AdminImageFieldLabel variant="aktuellMobile">Mobil hochladen</AdminImageFieldLabel>
                              <input
                                ref={(element) => {
                                  aktuellFileInputRefs.current[aktuellImageUploadKey(item.id, "mobile")] = element;
                                }}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={uploadingAktuellKey[aktuellImageUploadKey(item.id, "mobile")] ?? false}
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) {
                                    return;
                                  }

                                  setSelectedAktuellFileByKey((prev) => ({
                                    ...prev,
                                    [aktuellImageUploadKey(item.id, "mobile")]: file.name,
                                  }));
                                  await uploadAktuellImage(item.id, "mobile", file);
                                  event.target.value = "";
                                }}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-primary/40 bg-primary/5 text-primary transition-transform transition-shadow duration-150 hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-sm active:translate-y-0"
                                  disabled={uploadingAktuellKey[aktuellImageUploadKey(item.id, "mobile")] ?? false}
                                  onClick={() =>
                                    aktuellFileInputRefs.current[aktuellImageUploadKey(item.id, "mobile")]?.click()
                                  }
                                >
                                  Datei auswählen
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {selectedAktuellFileByKey[aktuellImageUploadKey(item.id, "mobile")] ??
                                    "Keine Datei"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <AdminImageFieldLabel variant="aktuellDesktop">Desktop hochladen</AdminImageFieldLabel>
                              <input
                                ref={(element) => {
                                  aktuellFileInputRefs.current[aktuellImageUploadKey(item.id, "desktop")] =
                                    element;
                                }}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={uploadingAktuellKey[aktuellImageUploadKey(item.id, "desktop")] ?? false}
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) {
                                    return;
                                  }

                                  setSelectedAktuellFileByKey((prev) => ({
                                    ...prev,
                                    [aktuellImageUploadKey(item.id, "desktop")]: file.name,
                                  }));
                                  await uploadAktuellImage(item.id, "desktop", file);
                                  event.target.value = "";
                                }}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-primary/40 bg-primary/5 text-primary transition-transform transition-shadow duration-150 hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-sm active:translate-y-0"
                                  disabled={
                                    uploadingAktuellKey[aktuellImageUploadKey(item.id, "desktop")] ?? false
                                  }
                                  onClick={() =>
                                    aktuellFileInputRefs.current[aktuellImageUploadKey(item.id, "desktop")]?.click()
                                  }
                                >
                                  Datei auswählen
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {selectedAktuellFileByKey[aktuellImageUploadKey(item.id, "desktop")] ??
                                    "Keine Datei"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <p className="text-xs text-muted-foreground">Erlaubt: JPG, PNG, WEBP (max. 5 MB)</p>
                              {uploadingAktuellKey[aktuellImageUploadKey(item.id, "mobile")] ||
                              uploadingAktuellKey[aktuellImageUploadKey(item.id, "desktop")] ? (
                                <p className="text-xs text-muted-foreground">Upload läuft…</p>
                              ) : null}
                              {uploadErrorAktuellById[item.id] ? (
                                <p className="text-xs text-destructive">{uploadErrorAktuellById[item.id]}</p>
                              ) : null}
                            </div>
                            <div className="space-y-2 md:col-span-2">
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
                          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={item.cta?.enabled ?? false}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    aktuell: {
                                      ...prev.aktuell,
                                      items: prev.aktuell.items.map((current) =>
                                        current.id === item.id
                                          ? {
                                              ...current,
                                              cta: {
                                                ...current.cta,
                                                enabled: event.target.checked,
                                              },
                                            }
                                          : current,
                                      ),
                                    },
                                  }))
                                }
                              />
                              Link-Button anzeigen
                            </label>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Button Text</Label>
                                <Input
                                  placeholder="Details ansehen"
                                  value={item.cta?.label ?? ""}
                                  disabled={!(item.cta?.enabled ?? false)}
                                  onChange={(event) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      aktuell: {
                                        ...prev.aktuell,
                                        items: prev.aktuell.items.map((current) =>
                                          current.id === item.id
                                            ? {
                                                ...current,
                                                cta: {
                                                  ...current.cta,
                                                  label: event.target.value || undefined,
                                                },
                                              }
                                            : current,
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Button Link</Label>
                                <Input
                                  placeholder="/#kontakt oder https://..."
                                  value={item.cta?.href ?? ""}
                                  disabled={!(item.cta?.enabled ?? false)}
                                  onChange={(event) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      aktuell: {
                                        ...prev.aktuell,
                                        items: prev.aktuell.items.map((current) =>
                                          current.id === item.id
                                            ? {
                                                ...current,
                                                cta: {
                                                  ...current.cta,
                                                  href: event.target.value || undefined,
                                                },
                                              }
                                            : current,
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Erlaubt: https://, http://, mailto:, #anker oder /pfad.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                blurActiveElementBeforeDomRemoval();
                                setDraft((prev) => ({
                                  ...prev,
                                  aktuell: {
                                    ...prev.aktuell,
                                    items: prev.aktuell.items.filter((current) => current.id !== item.id),
                                  },
                                }));
                              }}
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Kurse Label anzeigen</Label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.settings.coursesEyebrowEnabled !== false}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, coursesEyebrowEnabled: event.target.checked },
                          }))
                        }
                      />
                      <span>Kleine Zeile über dem Kurse-Titel anzeigen</span>
                    </label>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Kurse Label (kleine Zeile über H2)</Label>
                    <Input
                      value={draft.settings.sectionEyebrows?.courses ?? ""}
                      placeholder="Angebot"
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              courses: event.target.value || undefined,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Kurse-Titel (H2)</Label>
                    <Input
                      value={draft.settings.coursesSectionTitle ?? ""}
                      placeholder="Kurse & Termine"
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            coursesSectionTitle: event.target.value || undefined,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <MarkdownEditor
                      label="Kurse-Untertext (Markdown, Absatz unter dem Titel)"
                      value={draft.settings.coursesSectionIntro ?? ""}
                      rows={4}
                      placeholder='Als Bestandskund:in … über das [Kontaktformular](/#kontakt).'
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            coursesSectionIntro: value || undefined,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Button zur App (unter dem Einleitungstext)</Label>
                    <Input
                      value={draft.settings.coursesSectionAppButtonLabel ?? ""}
                      placeholder="Kurs buchen"
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            coursesSectionAppButtonLabel: event.target.value || undefined,
                          },
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Verlinkt auf die App-URL aus den allgemeinen Einstellungen. Leer lassen für den
                      Standardtext „Kurs buchen“.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Separator className="my-4" />
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-base">YogaFlow-Kurse</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={yogaflowSeriesList(draft.settings).length >= MAX_ITEMS_PER_LIST}
                        onClick={() => {
                          setDraft((prev) => {
                            const list = [...yogaflowSeriesList(prev.settings)];
                            const newId = buildId("series");
                            list.push({
                              id: newId,
                              sortOrder: getNextSortOrder(list),
                              matchTitles: ["Neuer App-Kurstitel"],
                              displayTitle: "Neuer Kurs",
                              description: "",
                              day: "",
                              time: "",
                              location: "",
                              bookingBadgeLabel: "Buchung über die App",
                            });
                            return {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                yogaflowCourseSeries: list,
                              },
                            };
                          });
                        }}
                      >
                        Kurs hinzufügen
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {yogaflowSeriesList(draft.settings).map((series, index) => (
                        <Card
                          key={series.id}
                          className="min-w-0 border border-dashed border-primary/30 ring-0"
                        >
                          <CardHeader className={ADMIN_COURSE_CARD_HEADER_CLASS}>
                            <div className="space-y-2 pl-3">
                              <CardTitle className="text-base">
                                Kurs {index + 1}{" "}
                                <span className="text-muted-foreground font-normal">
                                  ({series.displayTitle || series.id})
                                </span>
                              </CardTitle>
                              <CardDescription>
                                App-Titel müssen exakt zum Sync aus Supabase passen (mehrere
                                durch Komma oder Zeilenumbruch).
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3">
                            <div className="space-y-2">
                              <Label>Match: App-Kurstitel</Label>
                              <Textarea
                                rows={1}
                                className="min-h-9 resize-y"
                                value={series.matchTitles.join(", ")}
                                placeholder="Yoga am Dienstag"
                                onChange={(event) => {
                                  const titles = parseMatchTitlesInput(event.target.value);
                                  setDraft((prev) => {
                                    const list = [...yogaflowSeriesList(prev.settings)];
                                    list[index] = {
                                      ...list[index]!,
                                      matchTitles:
                                        titles.length > 0 ? titles : list[index]!.matchTitles,
                                    };
                                    return {
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        yogaflowCourseSeries: list,
                                      },
                                    };
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Anzeige-Titel (Karte)</Label>
                              <Input
                                value={series.displayTitle}
                                onChange={(event) => {
                                  const v = event.target.value;
                                  setDraft((prev) => {
                                    const list = [...yogaflowSeriesList(prev.settings)];
                                    list[index] = { ...list[index]!, displayTitle: v };
                                    return {
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        yogaflowCourseSeries: list,
                                      },
                                    };
                                  });
                                }}
                              />
                            </div>
                            <MarkdownEditor
                              label="Kursstil / Beschreibung (Markdown)"
                              rows={4}
                              value={series.description}
                              onChange={(v) => {
                                setDraft((prev) => {
                                  const list = [...yogaflowSeriesList(prev.settings)];
                                  list[index] = { ...list[index]!, description: v };
                                  return {
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      yogaflowCourseSeries: list,
                                    },
                                  };
                                });
                              }}
                            />
                            <div className="space-y-2">
                              <Label>Badge-Text (Pill unter dem Titel)</Label>
                              <Input
                                value={series.bookingBadgeLabel ?? ""}
                                placeholder="Buchung über die App"
                                onChange={(event) => {
                                  const v = event.target.value;
                                  setDraft((prev) => {
                                    const list = [...yogaflowSeriesList(prev.settings)];
                                    list[index] = {
                                      ...list[index]!,
                                      bookingBadgeLabel:
                                        v.trim() === "" ? undefined : v,
                                    };
                                    return {
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        yogaflowCourseSeries: list,
                                      },
                                    };
                                  });
                                }}
                              />
                              <p className="text-muted-foreground text-xs">
                                Leer lassen = auf der Website erscheint „Buchung über die App“.
                              </p>
                              <BookingBadgeLinkEditor
                                idPrefix={`series-badge-link-${series.id}`}
                                value={series.bookingBadgeLink}
                                onChange={(next) => {
                                  setDraft((prev) => {
                                    const list = [...yogaflowSeriesList(prev.settings)];
                                    list[index] = {
                                      ...list[index]!,
                                      bookingBadgeLink: next,
                                    };
                                    return {
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        yogaflowCourseSeries: list,
                                      },
                                    };
                                  });
                                }}
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                              <div className="space-y-2">
                                <AdminSortOrderLabelRow htmlFor={`series-sort-${series.id}`} />
                                <Input
                                  id={`series-sort-${series.id}`}
                                  inputMode="numeric"
                                  value={String(series.sortOrder)}
                                  onChange={(event) => {
                                    const n = parseNumber(event.target.value);
                                    setDraft((prev) => {
                                      const list = [...yogaflowSeriesList(prev.settings)];
                                      list[index] = { ...list[index]!, sortOrder: n };
                                      return {
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          yogaflowCourseSeries: list,
                                        },
                                      };
                                    });
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Preis (optional)</Label>
                                <Input
                                  value={series.price ?? ""}
                                  placeholder="12,00 €"
                                  onChange={(event) => {
                                    const v = event.target.value.trim();
                                    setDraft((prev) => {
                                      const list = [...yogaflowSeriesList(prev.settings)];
                                      list[index] = {
                                        ...list[index]!,
                                        price: v || undefined,
                                      };
                                      return {
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          yogaflowCourseSeries: list,
                                        },
                                      };
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                              <div className="space-y-2">
                                <Label>Wochentag-Zeile (z. B. Dienstag)</Label>
                                <Input
                                  value={series.day}
                                  onChange={(event) => {
                                    const v = event.target.value;
                                    setDraft((prev) => {
                                      const list = [...yogaflowSeriesList(prev.settings)];
                                      list[index] = { ...list[index]!, day: v };
                                      return {
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          yogaflowCourseSeries: list,
                                        },
                                      };
                                    });
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Zeit</Label>
                                <Input
                                  value={series.time}
                                  onChange={(event) => {
                                    const v = event.target.value;
                                    setDraft((prev) => {
                                      const list = [...yogaflowSeriesList(prev.settings)];
                                      list[index] = { ...list[index]!, time: v };
                                      return {
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          yogaflowCourseSeries: list,
                                        },
                                      };
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Ort</Label>
                              <Input
                                value={series.location}
                                onChange={(event) => {
                                  const v = event.target.value;
                                  setDraft((prev) => {
                                    const list = [...yogaflowSeriesList(prev.settings)];
                                    list[index] = { ...list[index]!, location: v };
                                    return {
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        yogaflowCourseSeries: list,
                                      },
                                    };
                                  });
                                }}
                              />
                            </div>
                            <MarkdownEditor
                              label="Hinweis unter Kursstil (optional, Markdown)"
                              rows={3}
                              value={series.scheduleNote ?? ""}
                              onChange={(v) => {
                                const trimmed = v.trim();
                                setDraft((prev) => {
                                  const list = [...yogaflowSeriesList(prev.settings)];
                                  list[index] = {
                                    ...list[index]!,
                                    scheduleNote: trimmed ? v : undefined,
                                  };
                                  return {
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      yogaflowCourseSeries: list,
                                    },
                                  };
                                });
                              }}
                            />
                          </CardContent>
                          <CardFooter className="flex justify-end border-border/70 bg-muted/35 px-4 py-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              disabled={yogaflowSeriesList(draft.settings).length <= 1}
                              className="min-w-[7.5rem] border-destructive/35 font-semibold text-destructive shadow-sm hover:border-destructive/55 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                blurActiveElementBeforeDomRemoval();
                                setDraft((prev) => {
                                  const list = yogaflowSeriesList(prev.settings).filter(
                                    (_, i) => i !== index,
                                  );
                                  return {
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      yogaflowCourseSeries: list,
                                    },
                                  };
                                });
                              }}
                            >
                              Entfernen
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Separator className="my-4" />
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-base">
                        Manuelle Kurs-Karten (erscheinen nach den YogaFlow-Kursen)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={draft.courses.length >= MAX_COURSES}
                        onClick={() => {
                          const newId = buildId("course");
                          setDraft((prev) => ({
                            ...prev,
                            courses: [
                              ...prev.courses,
                              {
                                id: newId,
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
                        }}
                      >
                        Kurs hinzufügen
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[...draft.courses]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((course, displayIndex) => {
                          const courseId = course.id;
                          const internal = isInternalCourse(course);
                          const external = isExternalCourse(course);
                          return (
                            <Card
                              key={courseId}
                              className="min-w-0 border border-dashed border-primary/30 ring-0"
                            >
                              <CardHeader className={ADMIN_COURSE_CARD_HEADER_CLASS}>
                                <div className="pl-3">
                                  <CardTitle className="text-base">
                                    Manuelle Karte {displayIndex + 1}
                                    <span className="text-muted-foreground font-normal">
                                      {" "}
                                      ({course.title || courseId})
                                    </span>
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`course-type-${courseId}`}>Kurs-Typ</Label>
                                  <select
                                    id={`course-type-${courseId}`}
                                    className={adminSelectClass}
                                    value={course.type}
                                    onChange={(event) => {
                                      const t = event.target.value as "internal" | "external";
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        const shared = {
                                          id: cur.id,
                                          title: cur.title,
                                          description: cur.description,
                                          day: cur.day,
                                          time: cur.time,
                                          location: cur.location,
                                          bookingStatus: cur.bookingStatus,
                                          sortOrder: cur.sortOrder,
                                          price: cur.price,
                                          remainingSpots: cur.remainingSpots,
                                          bookingBadgeLabel: cur.bookingBadgeLabel,
                                          bookingBadgeLink: cur.bookingBadgeLink,
                                        };
                                        const next: Course =
                                          t === "internal"
                                            ? {
                                                ...shared,
                                                type: "internal",
                                                scheduleNote: isInternalCourse(cur)
                                                  ? cur.scheduleNote
                                                  : undefined,
                                                startsOn: isInternalCourse(cur)
                                                  ? cur.startsOn
                                                  : undefined,
                                                endsOn: isInternalCourse(cur)
                                                  ? cur.endsOn
                                                  : undefined,
                                              }
                                            : {
                                                ...shared,
                                                type: "external",
                                                externalUrl: isExternalCourse(cur)
                                                  ? cur.externalUrl
                                                  : "https://",
                                                externalLinkLabel: isExternalCourse(cur)
                                                  ? cur.externalLinkLabel
                                                  : undefined,
                                              };
                                        return replaceCourseInDraft(prev, courseId, next);
                                      });
                                    }}
                                  >
                                    <option value="internal">Intern (ohne Anbieter-Link)</option>
                                    <option value="external">Extern mit URL</option>
                                  </select>
                                </div>
                                {external ? (
                                  <div className="space-y-2">
                                    <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                                      <div className="space-y-2">
                                        <Label htmlFor={`course-external-label-${courseId}`}>
                                          Button-Text (Link)
                                        </Label>
                                        <Input
                                          id={`course-external-label-${courseId}`}
                                          value={course.externalLinkLabel ?? ""}
                                          placeholder="Zur Anbieter-Seite"
                                          onChange={(event) => {
                                            const v = event.target.value;
                                            setDraft((prev) => {
                                              const cur = prev.courses.find((c) => c.id === courseId)!;
                                              if (!isExternalCourse(cur)) return prev;
                                              return replaceCourseInDraft(prev, courseId, {
                                                ...cur,
                                                externalLinkLabel:
                                                  v.trim() === "" ? undefined : v,
                                              });
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`course-url-${courseId}`}>URL</Label>
                                        <Input
                                          id={`course-url-${courseId}`}
                                          type="url"
                                          inputMode="url"
                                          autoComplete="url"
                                          value={course.externalUrl}
                                          placeholder="https://…"
                                          onChange={(event) => {
                                            const v = event.target.value;
                                            setDraft((prev) => {
                                              const cur = prev.courses.find((c) => c.id === courseId)!;
                                              if (!isExternalCourse(cur)) return prev;
                                              return replaceCourseInDraft(prev, courseId, {
                                                ...cur,
                                                externalUrl: v,
                                              });
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                      Button-Text: leer lassen = auf der Website „Zur Anbieter-Seite“.
                                    </p>
                                  </div>
                                ) : null}
                                <div className="space-y-2">
                                  <Label htmlFor={`course-title-${courseId}`}>Titel</Label>
                                  <Input
                                    id={`course-title-${courseId}`}
                                    value={course.title}
                                    onChange={(event) => {
                                      const v = event.target.value;
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        return replaceCourseInDraft(prev, courseId, {
                                          ...cur,
                                          title: v,
                                        });
                                      });
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`course-badge-${courseId}`}>
                                    Badge-Text (Pill unter dem Titel)
                                  </Label>
                                  <Input
                                    id={`course-badge-${courseId}`}
                                    value={course.bookingBadgeLabel ?? ""}
                                    placeholder="z. B. Probestunde auf Anfrage"
                                    onChange={(event) => {
                                      const v = event.target.value;
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        return replaceCourseInDraft(prev, courseId, {
                                          ...cur,
                                          bookingBadgeLabel:
                                            v.trim() === "" ? undefined : v,
                                        });
                                      });
                                    }}
                                  />
                                  <p className="text-muted-foreground text-xs">
                                    Ohne Text: die Pill zeigt „Plätze frei“ oder „Ausgebucht“ gemäß
                                    gespeichertem Kurs.
                                  </p>
                                  <BookingBadgeLinkEditor
                                    idPrefix={`course-badge-link-${courseId}`}
                                    value={course.bookingBadgeLink}
                                    onChange={(next) => {
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        return replaceCourseInDraft(prev, courseId, {
                                          ...cur,
                                          bookingBadgeLink: next,
                                        });
                                      });
                                    }}
                                  />
                                </div>
                                <MarkdownEditor
                                  label="Kursstil / Beschreibung (Markdown)"
                                  rows={4}
                                  value={course.description}
                                  onChange={(v) => {
                                    setDraft((prev) => {
                                      const cur = prev.courses.find((c) => c.id === courseId)!;
                                      return replaceCourseInDraft(prev, courseId, {
                                        ...cur,
                                        description: v,
                                      });
                                    });
                                  }}
                                />
                                <div className="space-y-2">
                                  <AdminSortOrderLabelRow htmlFor={`course-sort-${courseId}`} />
                                  <Input
                                    id={`course-sort-${courseId}`}
                                    inputMode="numeric"
                                    value={String(course.sortOrder)}
                                    onChange={(event) => {
                                      const n = parseNumber(event.target.value);
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        return replaceCourseInDraft(prev, courseId, {
                                          ...cur,
                                          sortOrder: n,
                                        });
                                      });
                                    }}
                                  />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                                  <div className="space-y-2">
                                    <Label htmlFor={`course-day-${courseId}`}>
                                      Wochentag-Zeile
                                    </Label>
                                    <Input
                                      id={`course-day-${courseId}`}
                                      value={course.day}
                                      onChange={(event) => {
                                        const v = event.target.value;
                                        setDraft((prev) => {
                                          const cur = prev.courses.find((c) => c.id === courseId)!;
                                          return replaceCourseInDraft(prev, courseId, {
                                            ...cur,
                                            day: v,
                                          });
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`course-time-${courseId}`}>Zeit</Label>
                                    <Input
                                      id={`course-time-${courseId}`}
                                      value={course.time}
                                      onChange={(event) => {
                                        const v = event.target.value;
                                        setDraft((prev) => {
                                          const cur = prev.courses.find((c) => c.id === courseId)!;
                                          return replaceCourseInDraft(prev, courseId, {
                                            ...cur,
                                            time: v,
                                          });
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`course-loc-${courseId}`}>Ort</Label>
                                  <Input
                                    id={`course-loc-${courseId}`}
                                    value={course.location}
                                    onChange={(event) => {
                                      const v = event.target.value;
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        return replaceCourseInDraft(prev, courseId, {
                                          ...cur,
                                          location: v,
                                        });
                                      });
                                    }}
                                  />
                                </div>
                                {internal ? (
                                  <MarkdownEditor
                                    label="Hinweis unter Kursstil (optional, Markdown)"
                                    rows={3}
                                    value={course.scheduleNote ?? ""}
                                    onChange={(v) => {
                                      setDraft((prev) => {
                                        const cur = prev.courses.find((c) => c.id === courseId)!;
                                        if (!isInternalCourse(cur)) return prev;
                                        return replaceCourseInDraft(prev, courseId, {
                                          ...cur,
                                          scheduleNote: v.trim() ? v : undefined,
                                        });
                                      });
                                    }}
                                  />
                                ) : null}
                              </CardContent>
                              <CardFooter className="flex justify-end border-border/70 bg-muted/35 px-4 py-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="default"
                                  disabled={draft.courses.length === 0}
                                  className="min-w-[7.5rem] border-destructive/35 font-semibold text-destructive shadow-sm hover:border-destructive/55 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => {
                                    blurActiveElementBeforeDomRemoval();
                                    setDraft((prev) => ({
                                      ...prev,
                                      courses: prev.courses.filter((c) => c.id !== courseId),
                                    }));
                                  }}
                                >
                                  Entfernen
                                </Button>
                              </CardFooter>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <strong className="text-foreground">YogaFlow:</strong> Termine kommen aus{" "}
                  <code className="text-xs">data/yogaflow-courses.json</code> (Sync: Supabase +
                  optional Playwright für Restplätze, Secret{" "}
                  <code className="text-xs">YOGAFLOW_APP_URL</code>). Pro YogaFlow-Kurs eine Karte
                  mit Terminliste; konkrete Daten und Status in der aufklappbaren Liste.{" "}
                  <strong className="text-foreground">Manuelle Kurse</strong> lassen sich oben
                  bearbeiten; auf der Seite erscheinen sie nach den YogaFlow-Kursen.
                </div>
              </div>
            ) : null}

            {activeSection === "prices" ? (
              <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Preise Label anzeigen</Label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.settings.pricesEyebrowEnabled !== false}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, pricesEyebrowEnabled: event.target.checked },
                          }))
                        }
                      />
                      <span>Kleine Zeile über dem Preise-Titel anzeigen</span>
                    </label>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Preise Label (kleine Zeile über H2)</Label>
                    <Input
                      value={draft.settings.sectionEyebrows?.prices ?? ""}
                      placeholder="Teilnahme"
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              prices: event.target.value || undefined,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Preise-Titel (H2)</Label>
                    <Input
                      value={draft.settings.pricesSectionTitle ?? ""}
                      placeholder="Preise"
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            pricesSectionTitle: event.target.value || undefined,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <MarkdownEditor
                      label="Preise-Untertext (Markdown, Absatz unter dem Titel)"
                      value={draft.settings.pricesSectionIntro ?? ""}
                      rows={4}
                      placeholder="Zahlung und Abwicklung außerhalb dieser Website …"
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            pricesSectionIntro: value || undefined,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
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
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  {draft.prices.map((price, index) => (
                    <div key={price.id} data-price-card-id={price.id} className="min-w-0">
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
                        onRemove={() => {
                          blurActiveElementBeforeDomRemoval();
                          setDraft((prev) => ({
                            ...prev,
                            prices: prev.prices.filter((current) => current.id !== price.id),
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "about" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="about-eyebrow">Eyebrow (nur Desktop)</Label>
                  <Input
                    id="about-eyebrow"
                    value={draft.about.eyebrow ?? ""}
                    placeholder="Kurz zu mir"
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        about: { ...prev.about, eyebrow: event.target.value },
                      }))
                    }
                  />
                  <p className="text-muted-foreground text-sm">
                    Kleines Label oberhalb der Überschrift in der Textkarte. Leer lassen für den Standard
                    „Kurz zu mir“.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about-title">Titel</Label>
                  <Textarea
                    id="about-title"
                    rows={2}
                    value={draft.about.title}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, about: { ...prev.about, title: event.target.value } }))
                    }
                    className="min-h-[4.5rem] resize-y"
                  />
                  <p className="text-muted-foreground text-sm">
                    Hauptüberschrift in der Textkarte (alle Viewports). Optional mehrzeilig mit
                    Zeilenumbruch in diesem Feld.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about-text">Fließtext</Label>
                  <Textarea
                    id="about-text"
                    rows={10}
                    value={draft.about.text}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        about: { ...prev.about, text: event.target.value },
                      }))
                    }
                    className="min-h-[12rem] resize-y font-sans"
                  />
                  <p className="text-muted-foreground text-sm">
                    Nur Klartext. Absätze mit einer Leerzeile trennen; einfacher Zeilenumbruch erzeugt eine
                    neue Zeile im selben Absatz.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 md:items-start">
                  <div className="space-y-2 md:col-span-2">
                    <AdminImageFieldLabel variant="aboutMobile" htmlFor="about-image-mobile-url">
                      Bild-URL (Mobil)
                    </AdminImageFieldLabel>
                    <Input
                      id="about-image-mobile-url"
                      value={draft.about.image.mobile.url}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          about: {
                            ...prev.about,
                            image: { ...prev.about.image, mobile: { url: event.target.value } },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <AdminImageFieldLabel variant="aboutDesktop" htmlFor="about-image-desktop-url">
                      Bild-URL (Desktop)
                    </AdminImageFieldLabel>
                    <Input
                      id="about-image-desktop-url"
                      value={draft.about.image.desktop.url}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          about: {
                            ...prev.about,
                            image: { ...prev.about.image, desktop: { url: event.target.value } },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <AdminImageFieldLabel variant="aboutMobile">Mobil hochladen</AdminImageFieldLabel>
                    <input
                      ref={aboutImageMobileFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingAboutSlot !== null}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        setSelectedAboutFileNameMobile(file.name);
                        await uploadAboutImage("mobile", file);
                        event.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-primary/40 bg-primary/5 text-primary transition-transform transition-shadow duration-150 hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-sm active:translate-y-0"
                        disabled={uploadingAboutSlot !== null}
                        onClick={() => aboutImageMobileFileInputRef.current?.click()}
                      >
                        Datei auswählen
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedAboutFileNameMobile || "Keine Datei"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AdminImageFieldLabel variant="aboutDesktop">Desktop hochladen</AdminImageFieldLabel>
                    <input
                      ref={aboutImageDesktopFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingAboutSlot !== null}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        setSelectedAboutFileNameDesktop(file.name);
                        await uploadAboutImage("desktop", file);
                        event.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-primary/40 bg-primary/5 text-primary transition-transform transition-shadow duration-150 hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-sm active:translate-y-0"
                        disabled={uploadingAboutSlot !== null}
                        onClick={() => aboutImageDesktopFileInputRef.current?.click()}
                      >
                        Datei auswählen
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedAboutFileNameDesktop || "Keine Datei"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs text-muted-foreground">Erlaubt: JPG, PNG, WEBP (max. 5 MB)</p>
                    {uploadingAboutSlot ? (
                      <p className="text-xs text-muted-foreground">Upload läuft…</p>
                    ) : null}
                    {uploadErrorAbout ? (
                      <p className="text-xs text-destructive">{uploadErrorAbout}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="about-image-alt" className="font-bold">
                      Bild Alt-Text
                    </Label>
                    <Input
                      id="about-image-alt"
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
                  <Label>Button-Beschriftung (Absenden)</Label>
                  <Input
                    value={draft.contact.formSubmitLabel}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, formSubmitLabel: event.target.value },
                      }))
                    }
                    placeholder="Unverbindlich anfragen"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Success-Nachricht</Label>
                  <Textarea
                    rows={4}
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
                  <Field label="App URL" value={draft.settings.appUrl} onChange={(value) =>
                    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, appUrl: value } }))
                  } />
                  <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 p-4 md:col-span-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Logo & Nav Wordmark</h3>
                      <p className="text-xs text-muted-foreground">
                        Alle Einstellungen für Navigation-Logo und Wordmark.
                      </p>
                    </div>
                    <Field label="Nav Wordmark" value={draft.settings.navWordmark ?? ""} onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, navWordmark: value || undefined },
                      }))
                    } />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Navigation anzeigen</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={logoEnabled}
                            disabled={logoEnabled && !canDisableLogo}
                            onChange={(event) => {
                              const nextChecked = event.target.checked;
                              if (!nextChecked && !canDisableLogo) {
                                return;
                              }
                              setDraft((prev) => ({
                                ...prev,
                                settings: { ...prev.settings, logoEnabled: nextChecked },
                              }));
                            }}
                          />
                          <span>Logo anzeigen</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={wordmarkEnabled}
                            disabled={wordmarkEnabled && !canDisableWordmark}
                            onChange={(event) => {
                              const nextChecked = event.target.checked;
                              if (!nextChecked && !canDisableWordmark) {
                                return;
                              }
                              setDraft((prev) => ({
                                ...prev,
                                settings: { ...prev.settings, wordmarkEnabled: nextChecked },
                              }));
                            }}
                          />
                          <span>Nav Wordmark anzeigen</span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mindestens eines muss aktiv bleiben: Logo oder Nav Wordmark.
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 md:items-start">
                    <div className="space-y-2 md:col-span-2">
                      <AdminImageFieldLabel variant="logoMobile" htmlFor="settings-logo-mobile-url">
                        Logo-URL (Mobil)
                      </AdminImageFieldLabel>
                      <Input
                        id="settings-logo-mobile-url"
                        value={draft.settings.logo?.mobile.url ?? ""}
                        onChange={(event) =>
                          setDraft((prev) => {
                            const prevLogo = prev.settings.logo ?? {
                              mobile: { url: "" },
                              desktop: { url: "" },
                            };
                            return {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                logo: { ...prevLogo, mobile: { url: event.target.value } },
                              },
                            };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <AdminImageFieldLabel variant="logoDesktop" htmlFor="settings-logo-desktop-url">
                        Logo-URL (Desktop)
                      </AdminImageFieldLabel>
                      <Input
                        id="settings-logo-desktop-url"
                        value={draft.settings.logo?.desktop.url ?? ""}
                        onChange={(event) =>
                          setDraft((prev) => {
                            const prevLogo = prev.settings.logo ?? {
                              mobile: { url: "" },
                              desktop: { url: "" },
                            };
                            return {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                logo: { ...prevLogo, desktop: { url: event.target.value } },
                              },
                            };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <AdminImageFieldLabel variant="logoMobile">Logo Mobil hochladen</AdminImageFieldLabel>
                      <input
                        ref={logoImageMobileFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingLogoSlot !== null}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          setSelectedLogoFileNameMobile(file.name);
                          await uploadLogoImage("mobile", file);
                          event.target.value = "";
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-primary/40 bg-primary/5 text-primary"
                          disabled={uploadingLogoSlot !== null}
                          onClick={() => logoImageMobileFileInputRef.current?.click()}
                        >
                          Datei (Mobil)
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {selectedLogoFileNameMobile || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <AdminImageFieldLabel variant="logoDesktop">Logo Desktop hochladen</AdminImageFieldLabel>
                      <input
                        ref={logoImageDesktopFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingLogoSlot !== null}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          setSelectedLogoFileNameDesktop(file.name);
                          await uploadLogoImage("desktop", file);
                          event.target.value = "";
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-primary/40 bg-primary/5 text-primary"
                          disabled={uploadingLogoSlot !== null}
                          onClick={() => logoImageDesktopFileInputRef.current?.click()}
                        >
                          Datei (Desktop)
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {selectedLogoFileNameDesktop || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-xs text-muted-foreground">Logo: JPG, PNG, WEBP (max. 5 MB)</p>
                      {uploadingLogoSlot ? (
                        <p className="text-xs text-muted-foreground">Upload läuft…</p>
                      ) : null}
                      {uploadErrorLogo ? (
                        <p className="text-xs text-destructive">{uploadErrorLogo}</p>
                      ) : null}
                    </div>
                  </div>
                  </div>
                  <div className="grid gap-3 md:col-span-2 md:grid-cols-2 md:items-start">
                    <div className="space-y-2 md:col-span-2">
                      <AdminImageFieldLabel variant="ogMobile" htmlFor="settings-og-mobile-url">
                        OG-Bild-URL (Mobil)
                      </AdminImageFieldLabel>
                      <Input
                        id="settings-og-mobile-url"
                        value={draft.settings.ogImage?.mobile.url ?? ""}
                        onChange={(event) =>
                          setDraft((prev) => {
                            const prevOg = prev.settings.ogImage ?? {
                              mobile: { url: "" },
                              desktop: { url: "" },
                            };
                            return {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                ogImage: { ...prevOg, mobile: { url: event.target.value } },
                              },
                            };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <AdminImageFieldLabel variant="ogDesktop" htmlFor="settings-og-desktop-url">
                        OG-Bild-URL (Desktop)
                      </AdminImageFieldLabel>
                      <Input
                        id="settings-og-desktop-url"
                        value={draft.settings.ogImage?.desktop.url ?? ""}
                        onChange={(event) =>
                          setDraft((prev) => {
                            const prevOg = prev.settings.ogImage ?? {
                              mobile: { url: "" },
                              desktop: { url: "" },
                            };
                            return {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                ogImage: { ...prevOg, desktop: { url: event.target.value } },
                              },
                            };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <AdminImageFieldLabel variant="ogMobile">OG Mobil hochladen</AdminImageFieldLabel>
                      <input
                        ref={ogImageMobileFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingOgSlot !== null}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          setSelectedOgFileNameMobile(file.name);
                          await uploadOgImage("mobile", file);
                          event.target.value = "";
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-primary/40 bg-primary/5 text-primary"
                          disabled={uploadingOgSlot !== null}
                          onClick={() => ogImageMobileFileInputRef.current?.click()}
                        >
                          Datei (Mobil)
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {selectedOgFileNameMobile || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <AdminImageFieldLabel variant="ogDesktop">OG Desktop hochladen</AdminImageFieldLabel>
                      <input
                        ref={ogImageDesktopFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingOgSlot !== null}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          setSelectedOgFileNameDesktop(file.name);
                          await uploadOgImage("desktop", file);
                          event.target.value = "";
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-primary/40 bg-primary/5 text-primary"
                          disabled={uploadingOgSlot !== null}
                          onClick={() => ogImageDesktopFileInputRef.current?.click()}
                        >
                          Datei (Desktop)
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {selectedOgFileNameDesktop || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        OG: JPG, PNG, WEBP (max. 5 MB). Link-Vorschau nutzt primär die Desktop-URL.
                      </p>
                      {uploadingOgSlot ? (
                        <p className="text-xs text-muted-foreground">Upload läuft…</p>
                      ) : null}
                      {uploadErrorOg ? <p className="text-xs text-destructive">{uploadErrorOg}</p> : null}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 p-4 md:col-span-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Favicon</h3>
                      <p className="text-xs text-muted-foreground">
                        Symbol im Browser-Tab; JPG, PNG oder WebP (max. 5 MB).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <AdminImageFieldLabel variant="favicon" htmlFor="settings-favicon-url">
                        Favicon-URL
                      </AdminImageFieldLabel>
                      <Input
                        id="settings-favicon-url"
                        value={draft.settings.faviconUrl ?? ""}
                        onChange={(event) => {
                          const v = event.target.value.trim();
                          setDraft((prev) => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              faviconUrl: v || undefined,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <AdminImageFieldLabel variant="favicon">Favicon hochladen</AdminImageFieldLabel>
                      <input
                        ref={faviconFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingFavicon}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          setSelectedFaviconFileName(file.name);
                          await uploadFaviconImage(file);
                          event.target.value = "";
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-primary/40 bg-primary/5 text-primary"
                          disabled={uploadingFavicon}
                          onClick={() => faviconFileInputRef.current?.click()}
                        >
                          Datei wählen
                        </Button>
                        <span className="text-xs text-muted-foreground">{selectedFaviconFileName || "—"}</span>
                      </div>
                    </div>
                    {draft.settings.faviconUrl?.trim() ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageUrl(draft.settings.faviconUrl.trim())}
                          alt=""
                          className="size-8 rounded border border-border/60 bg-background object-contain"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-[7.5rem] border-destructive/35 font-semibold text-destructive shadow-sm hover:border-destructive/55 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, faviconUrl: undefined },
                            }))
                          }
                        >
                          Favicon entfernen
                        </Button>
                      </div>
                    ) : null}
                    {uploadingFavicon ? (
                      <p className="text-xs text-muted-foreground">Upload läuft…</p>
                    ) : null}
                    {uploadErrorFavicon ? (
                      <p className="text-xs text-destructive">{uploadErrorFavicon}</p>
                    ) : null}
                  </div>
                  <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 p-4 md:col-span-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">SEO</h3>
                      <p className="text-xs text-muted-foreground">
                        Seitentitel und Meta-Beschreibung für Suchmaschinen.
                      </p>
                    </div>
                    <Field label="Site Title" value={draft.settings.siteTitle ?? ""} onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, siteTitle: value || undefined },
                      }))
                    } />
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <Textarea
                        rows={4}
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
                      onRemove={() => {
                        blurActiveElementBeforeDomRemoval();
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            navigation: navigation.filter((_, currentIndex) => currentIndex !== index),
                          },
                        }));
                      }}
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

            <div className="hidden flex-wrap items-center gap-3 border-t border-border pt-4 md:flex">
              <Button type="submit" disabled={savePending}>
                {savePending ? "Speichern..." : "Änderungen speichern"}
              </Button>
              {desktopSaveFeedbackShow && (saveState.message || saveState.error) ? (
                <div
                  className={cn(
                    "flex flex-col gap-0.5 transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    desktopSaveFeedbackFadeOut ? "opacity-0" : "opacity-100",
                  )}
                >
                  {saveState.message ? (
                    <p className="text-sm text-primary">{saveState.message}</p>
                  ) : null}
                  {saveState.error ? (
                    <p className="text-sm text-destructive">{saveState.error}</p>
                  ) : null}
                </div>
              ) : null}
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
  disabled = false,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-7 items-center">
        <Label>{label}</Label>
      </div>
      <Input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
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
      <CardHeader className={ADMIN_LIST_CARD_HEADER_CLASS}>
        <CardTitle className="pl-2 text-sm font-bold leading-none">Preis {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ID" value={item.id} onChange={(value) => onChange({ ...item, id: value })} />
          <div className="space-y-2">
            <AdminSortOrderLabelRow htmlFor={`price-sort-${item.id}`} />
            <Input
              id={`price-sort-${item.id}`}
              type="number"
              value={String(item.sortOrder)}
              onChange={(event) => onChange({ ...item, sortOrder: parseNumber(event.target.value) })}
            />
          </div>
          <Field label="Titel" value={item.title} onChange={(value) => onChange({ ...item, title: value })} />
          <Field
            label="Info- / Preislabel"
            value={item.price}
            onChange={(value) => onChange({ ...item, price: value })}
          />
          <Field
            label="Link URL (optional)"
            value={item.linkUrl ?? ""}
            onChange={(value) => onChange({ ...item, linkUrl: value || undefined })}
          />
        </div>
        <MarkdownEditor
          label="Beschreibung (Markdown)"
          value={item.description}
          rows={4}
          onChange={(value) => onChange({ ...item, description: value })}
        />
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
