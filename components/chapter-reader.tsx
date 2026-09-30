"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkPlus, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatReference } from "@/lib/bible/books";
import { cn } from "@/lib/utils";

type Row = { verse: number; verseEnd: number; text: string };

// Chapter text; tap a verse to select it, tap another to extend to a range, then save it.
export function ChapterReader({
  bookName,
  chapter,
  translation,
  rows,
  saved,
}: {
  bookName: string;
  chapter: number;
  translation: string;
  rows: Row[];
  saved: { start: number; end: number; id: string }[];
}) {
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);

  function tap(row: Row) {
    if (!range) return setRange({ start: row.verse, end: row.verseEnd });
    // Tapping the only selected verse clears; otherwise grow or shrink the range to include it.
    if (range.start === row.verse && range.end === row.verseEnd) return setRange(null);
    setRange({ start: Math.min(range.start, row.verse), end: Math.max(range.end, row.verseEnd) });
  }

  const inRange = (row: Row) => range !== null && row.verse >= range.start && row.verseEnd <= range.end;
  const isSaved = (row: Row) => saved.some((s) => row.verse <= s.end && row.verseEnd >= s.start);
  const reference = range ? formatReference(bookName, chapter, range.start, range.end) : "";

  return (
    <>
      {/* A quiet page under the text, so a theme's texture or scenery doesn't run through it. */}
      <div data-tour="bible-verse" className="-mx-1 rounded-2xl border border-border/50 bg-card/85 px-4 py-5 font-serif text-[1.2rem] leading-[1.9] text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur-sm">
        {rows.map((row) => (
          <span
            key={row.verse}
            id={`v${row.verse}`}
            role="button"
            tabIndex={0}
            aria-pressed={inRange(row)}
            onClick={() => tap(row)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), tap(row))}
            className={cn(
              "scroll-mt-20 cursor-pointer rounded decoration-primary/40 decoration-2 underline-offset-4 transition-colors",
              inRange(row) ? "bg-primary/15" : "hover:bg-muted",
              isSaved(row) && "underline",
            )}
          >
            <sup className="mr-0.5 font-sans text-[0.65rem] font-medium text-muted-foreground">
              {row.verseEnd > row.verse ? `${row.verse}–${row.verseEnd}` : row.verse}
            </sup>
            {row.text}{" "}
          </span>
        ))}
      </div>

      {range && (
        <div className="animate-rise sticky bottom-4 z-20 mt-6 flex items-center gap-2 rounded-2xl border bg-background/95 p-2 pl-4 shadow-lg backdrop-blur-md">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{reference}</span>
          <button
            type="button"
            onClick={() => setRange(null)}
            aria-label="Clear selection"
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
          <Link
            href={`/verses/new?ref=${encodeURIComponent(reference)}&t=${translation}`}
            transitionTypes={["nav-forward"]}
            className={cn(buttonVariants(), "h-10 gap-1.5 px-4")}
          >
            <BookmarkPlus className="size-4" aria-hidden /> Keep
          </Link>
        </div>
      )}
    </>
  );
}
