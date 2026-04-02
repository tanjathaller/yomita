"use client";

import {
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
import ReactMarkdown from "react-markdown";
import { AlertCircle, Heading3, Link2, ListOrdered } from "lucide-react";
import remarkBreaks from "remark-breaks";

import type { SaveContentActionState } from "@/app/(admin)/admin/actions";
import type { NavItem, PriceItem, SiteContent } from "@/types/site-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_ITEMS_PER_LIST = 10;
const SORT_ORDER_HELP_TEXT = "Niedrige Zahl = weiter oben auf der öffentlichen Website.";
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

function escapeMarkdownLinkText(rawText: string): string {
  return rawText.replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function isValidEditorUrl(url: string): boolean {
  if (/^https?:\/\/\S+$/i.test(url)) {
    return true;
  }
  if (/^mailto:\S+@\S+\.\S+$/i.test(url)) {
    return true;
  }
  if (/^#[a-z0-9-]+$/i.test(url)) {
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

    if (href.startsWith("#")) {
      if (!isInternalAnchorHref(href)) {
        warnings.add(
          `Unbekannter Anker-Link: "${href}". Erlaubt sind: ${Array.from(VALID_INTERNAL_ANCHORS).join(", ")}.`,
        );
      }
      continue;
    }

    if (!/^https?:\/\/\S+$/i.test(href) && !/^mailto:\S+@\S+\.\S+$/i.test(href)) {
      warnings.add(`Ungültige Link-URL: "${href}". Erlaubt: https://, http://, mailto: oder #anker.`);
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
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  rows?: number;
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
      setLinkInputError("Ungültige URL. Erlaubt: https://, http://, mailto: oder #anker.");
      return;
    }
    if (trimmedUrl.startsWith("#") && !isInternalAnchorHref(trimmedUrl)) {
      setLinkInputError(`Unbekannter Anker: ${trimmedUrl}`);
      return;
    }
    if (trimmedUrl.startsWith("#") && linkTarget === "blank") {
      setLinkInputError("Anker-Links öffnen immer im gleichen Fenster.");
      return;
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
                  size="default"
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
                                image: { url: "", alt: "" },
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
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
                    <Label>Kurse-Untertext (Absatz unter dem Titel)</Label>
                    <Textarea
                      rows={4}
                      value={draft.settings.coursesSectionIntro ?? ""}
                      placeholder="Als Bestandskund:in buchst du deine Stunden ganz entspannt über die App ..."
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            coursesSectionIntro: event.target.value || undefined,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
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
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Die einzelnen Kurs-Cards werden im Admin-Dashboard derzeit nicht angezeigt.
                  Kursdaten kommen später aus einer externen Quelle.
                </div>
              </div>
            ) : null}

            {activeSection === "prices" ? (
              <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Preise Label (kleine Zeile)</Label>
                    <Input
                      value={draft.settings.sectionEyebrows?.prices ?? ""}
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
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">Section-Labels (kleine Zeile über Headlines)</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Hero Label"
                      value={draft.settings.sectionEyebrows?.hero ?? ""}
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              hero: value || undefined,
                            },
                          },
                        }))
                      }
                    />
                    <Field
                      label="Aktuelles Label"
                      value={draft.settings.sectionEyebrows?.aktuell ?? ""}
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              aktuell: value || undefined,
                            },
                          },
                        }))
                      }
                    />
                    <Field
                      label="Kurse Label"
                      value={draft.settings.sectionEyebrows?.courses ?? ""}
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              courses: value || undefined,
                            },
                          },
                        }))
                      }
                    />
                    <Field
                      label="Preise Label"
                      value={draft.settings.sectionEyebrows?.prices ?? ""}
                      onChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            sectionEyebrows: {
                              ...prev.settings.sectionEyebrows,
                              prices: value || undefined,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leer lassen = Fallback auf Standardtexte (Hero: Business Name, sonst Journal/Angebot/Teilnahme).
                  </p>
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
  disabled = false,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
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
          <Textarea
            rows={4}
            value={item.description}
            onChange={(event) => onChange({ ...item, description: event.target.value })}
          />
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
