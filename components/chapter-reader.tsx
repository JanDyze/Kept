"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BookmarkCheck, BookmarkPlus, Eraser, Loader2, Palette, X } from "lucide-react";
import { keepVerse } from "@/app/verses/actions";
import { setHighlight } from "@/app/bible/actions";
import { announceKept } from "@/components/keep-button";
import { formatReference } from "@/lib/bible/books";
import { HIGHLIGHTS, type HighlightColor } from "@/lib/bible/highlights";
import { cn } from "@/lib/utils";

type Row = { verse: number; verseEnd: number; text: string };

// Chapter text; tap a verse to select it, tap another to extend to a range, then keep it in one
// tap (Customize opens the add page for tags), or highlight it to come back to. A verse reached
// from search (#v12) is marked so it's easy to find.
export function ChapterReader({
  bookName,
  bookNumber,
  chapter,
  translation,
  rows,
  saved: initialSaved,
  highlights: initialHighlights,
}: {
  bookName: string;
  bookNumber: number;
  chapter: number;
  translation: string;
  rows: Row[];
  saved: { start: number; end: number; id: string }[];
  highlights: Record<number, HighlightColor>;
}) {
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [marks, setMarks] = useState(initialHighlights);
  const [found, setFound] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keeping, startKeeping] = useTransition();
  const [, startTransition] = useTransition();

  // The verse in the address (#v12), from search or a link: marked until something is tapped.
  useEffect(() => {
    const read = () => {
      const m = /^#v(\d+)$/.exec(location.hash);
      setFound(m ? Number(m[1]) : null);
    };
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);

  function tap(row: Row) {
    setFound(null);
    setError(null);
    if (!range) return setRange({ start: row.verse, end: row.verseEnd });
    // Tapping the only selected verse clears; otherwise grow or shrink the range to include it.
    if (range.start === row.verse && range.end === row.verseEnd) return setRange(null);
    setRange({ start: Math.min(range.start, row.verse), end: Math.max(range.end, row.verseEnd) });
  }

  const inRange = (row: Row) => range !== null && row.verse >= range.start && row.verseEnd <= range.end;
  const isSaved = (row: Row) => saved.some((s) => row.verse <= s.end && row.verseEnd >= s.start);
  const isFound = (row: Row) => found !== null && row.verse <= found && row.verseEnd >= found;
  const reference = range ? formatReference(bookName, chapter, range.start, range.end) : "";
  const rangeSaved = range !== null && saved.some((s) => s.start <= range.start && s.end >= range.end);
  const rangeMarked = range !== null && rows.some((r) => inRange(r) && marks[r.verse]);

  function keep() {
    if (!range) return;
    setError(null);
    startKeeping(async () => {
      const result = await keepVerse(reference, translation).catch(() => ({ ok: false as const, error: "That didn't save. Check your connection and try again." }));
      if (!result.ok) return setError(result.error);
      setSaved((list) => [...list, { start: range.start, end: range.end, id: result.id }]);
      announceKept({ id: result.id, reference: result.reference });
      setRange(null);
    });
  }

  function mark(color: HighlightColor | null) {
    if (!range) return;
    const was = marks;
    const next = { ...marks };
    for (let v = range.start; v <= range.end; v++) {
      if (color) next[v] = color;
      else delete next[v];
    }
    setMarks(next);
    setRange(null);
    startTransition(async () => {
      const result = await setHighlight({ bookNumber, chapter, start: range.start, end: range.end, color }).catch(() => ({
        error: "That didn't save. Check your connection and try again.",
      }));
      if (result.error) {
        setMarks(was);
        setError(result.error);
      }
    });
  }

  return (
    <>
      {/* A quiet page under the text, so a theme's texture or scenery doesn't run through it. */}
      <div
        data-tour="bible-verse"
        className="-mx-1 rounded-2xl border border-border/50 bg-card/85 px-4 py-5 font-serif text-[1.2rem] leading-[1.9] text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur-sm"
      >
        {rows.map((row) => {
          const color = marks[row.verse];
          return (
            <span
              key={row.verse}
              id={`v${row.verse}`}
              role="button"
              tabIndex={0}
              aria-pressed={inRange(row)}
              onClick={() => tap(row)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), tap(row))}
              className={cn(
                "scroll-mt-28 cursor-pointer rounded box-decoration-clone decoration-primary/50 decoration-2 underline-offset-4 transition-colors",
                inRange(row) ? "bg-primary/15 ring-2 ring-primary/40" : color ? HIGHLIGHTS[color].wash : "hover:bg-muted",
                isFound(row) && !inRange(row) && cn("animate-found ring-2 ring-primary", !color && "bg-primary/10"),
                isSaved(row) && "underline",
              )}
            >
              <sup className="mr-0.5 font-sans text-[0.65rem] font-medium text-muted-foreground">
                {isSaved(row) && <BookmarkCheck className="mr-0.5 inline size-3 -translate-y-px text-primary" aria-label="Kept" />}
                {row.verseEnd > row.verse ? `${row.verse}–${row.verseEnd}` : row.verse}
              </sup>
              {row.text}{" "}
            </span>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {range && (
        <div className="animate-rise sticky bottom-4 z-20 mt-6 flex flex-col gap-2 rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 pl-2">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{reference}</span>
            <button
              type="button"
              onClick={() => setRange(null)}
              aria-label="Clear selection"
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Highlighter: a color, or clear. */}
            <div role="group" aria-label="Highlight" className="flex items-center gap-1 rounded-xl bg-muted p-1">
              {(Object.keys(HIGHLIGHTS) as HighlightColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => mark(c)}
                  aria-label={`Highlight ${HIGHLIGHTS[c].label.toLowerCase()}`}
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-background"
                >
                  <span className={cn("size-5 rounded-full ring-1 ring-black/10", HIGHLIGHTS[c].dot)} />
                </button>
              ))}
              {rangeMarked && (
                <button
                  type="button"
                  onClick={() => mark(null)}
                  aria-label="Remove highlight"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <Eraser className="size-4" aria-hidden />
                </button>
              )}
            </div>
            {rangeSaved ? (
              <span className="ml-auto inline-flex h-10 items-center gap-1.5 px-2 text-sm text-muted-foreground">
                <BookmarkCheck className="size-4" aria-hidden /> Kept
              </span>
            ) : (
              <>
                <Link
                  href={`/verses/new?ref=${encodeURIComponent(reference)}&t=${translation}`}
                  transitionTypes={["nav-forward"]}
                  aria-label="Keep with tags"
                  className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Palette className="size-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={keep}
                  disabled={keeping}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                >
                  {keeping ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />} Keep
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
