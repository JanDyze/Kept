import Link from "next/link";
import { BookmarkCheck, BookOpen } from "lucide-react";
import { KeepButton } from "@/components/keep-button";
import { BOOKS, bookSlug } from "@/lib/bible/books";
import type { HighlightedPassage } from "@/lib/bible/highlight-queries";
import { HIGHLIGHTS } from "@/lib/bible/highlights";
import { cn } from "@/lib/utils";

// The Bible page's row of what you've highlighted while reading, newest first: read it again in
// its chapter, or keep it as a memory verse in one tap.
export function HighlightShelf({ items, translation }: { items: HighlightedPassage[]; translation: "ESV" | "MBBTAG" }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="highlights" className="mb-6">
      <h2 id="highlights" className="mb-2 text-sm font-medium text-muted-foreground">
        Highlights
      </h2>
      <ul data-no-swipe className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {items.map((h) => {
          const book = BOOKS[h.bookNumber - 1];
          const shown = translation === "MBBTAG" ? h.reference.replace(book.name, book.tl) : h.reference;
          return (
            <li
              key={`${h.bookNumber}:${h.chapter}:${h.verseStart}:${h.color}`}
              className="flex w-64 shrink-0 snap-start flex-col rounded-2xl border bg-card p-3"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("size-2.5 shrink-0 rounded-full", HIGHLIGHTS[h.color].dot)} aria-hidden />
                <span className="truncate">{shown}</span>
              </p>
              <p className={cn("mt-1.5 line-clamp-3 flex-1 rounded px-1 font-serif text-[0.95rem] leading-relaxed box-decoration-clone", HIGHLIGHTS[h.color].wash)}>
                {h.text}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <Link
                  href={`/bible/${bookSlug(book)}/${h.chapter}?t=${translation}#v${h.verseStart}`}
                  transitionTypes={["nav-forward"]}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <BookOpen className="size-4" aria-hidden /> Read
                </Link>
                <span className="ml-auto">
                  {h.kept ? (
                    <span className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-muted-foreground">
                      <BookmarkCheck className="size-4" aria-hidden /> Kept
                    </span>
                  ) : (
                    <KeepButton reference={h.reference} translation={translation} />
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
