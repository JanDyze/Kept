"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Plus, Search, X } from "lucide-react";
import { CardBackdrop, cardFontClass } from "@/components/memory-card";
import { Morph, morphName } from "@/components/verse-morph";
import { buttonVariants } from "@/components/ui/button";
import { cardColors, type CardStyle } from "@/lib/cards/style";
import { currentPath, rememberList, takeListMemory, type ListMemory } from "@/lib/scroll-memory";
import { cn } from "@/lib/utils";
import { tagLabel } from "@/lib/verses/tag-label";
import { SORT_COOKIE, type LibrarySort } from "@/lib/verses/view";

export type LibraryItem = {
  id: string;
  reference: string;
  localReference: string | null; // Tagalog book name for MBBTAG verses
  book: string;
  translation: string;
  text: string;
  tags: string[];
  card: CardStyle | null; // shown in its colors, photo and font when set
  bibleOrder?: number; // position in Bible order
  addedAt?: number; // ms; for archived verses, when they were archived
};

// Saved for a year so the page renders in the same order next time, with no flash.
function rememberSort(sort: LibrarySort) {
  document.cookie = `${SORT_COOKIE}=${sort}; path=/; max-age=31536000; samesite=lax`;
}

export function VerseLibrary({
  items,
  archived,
  initialSort,
  initialTag,
}: {
  items: LibraryItem[];
  archived: boolean;
  initialSort: LibrarySort;
  initialTag?: string;
}) {
  const [sort, setSort] = useState<LibrarySort>(initialSort);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | undefined>(initialTag);

  // Coming back from a verse: put the filters back, then (once the list shows them) the scroll
  // spot. Layout effects, so it lands before paint and the verse morphs back into the right tile.
  const restoring = useRef<ListMemory | null>(null);
  useLayoutEffect(() => {
    const memory = takeListMemory(currentPath());
    if (!memory) return;
    restoring.current = memory;
    /* eslint-disable react-hooks/set-state-in-effect -- restoring saved UI state before paint */
    setQuery(memory.query ?? "");
    setTag(memory.tag);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useLayoutEffect(() => {
    const memory = restoring.current;
    if (!memory || (memory.query ?? "") !== query || memory.tag !== tag) return;
    restoring.current = null;
    window.scrollTo(0, memory.y);
  }, [query, tag]);
  const rememberSpot = () => rememberList(currentPath(), { y: window.scrollY, query, tag });

  function toggleSort() {
    const next = sort === "recent" ? "book" : "recent";
    setSort(next);
    rememberSort(next);
  }

  const tags = useMemo(() => [...new Set(items.flatMap((v) => v.tags))].sort(), [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordered = [...items].sort((a, b) =>
      sort === "recent" ? (b.addedAt ?? 0) - (a.addedAt ?? 0) : (a.bibleOrder ?? 0) - (b.bibleOrder ?? 0),
    );
    return ordered.filter(
      (v) =>
        (!tag || v.tags.includes(tag)) &&
        (!q ||
          v.reference.toLowerCase().includes(q) ||
          v.localReference?.toLowerCase().includes(q) ||
          v.tags.some((t) => t.includes(q)) ||
          v.text.toLowerCase().includes(q)),
    );
  }, [items, tag, query, sort]);

  // By book: consecutive verses grouped under their book. Recent: one list, newest first.
  const groups = useMemo(() => {
    if (sort === "recent") return [{ book: "", verses: shown }];
    const out: { book: string; verses: LibraryItem[] }[] = [];
    for (const v of shown) {
      const last = out[out.length - 1];
      if (last?.book === v.book) last.verses.push(v);
      else out.push({ book: v.book, verses: [v] });
    }
    return out;
  }, [shown, sort]);

  const filtering = Boolean(query || tag);

  return (
    <>
      {items.length > 0 && (
        <div className="sticky top-(--header-offset) z-20 -mx-4 -mt-2 flex flex-col gap-3 bg-background/85 px-4 pb-3 pt-3 backdrop-blur-md transition-[top] duration-300 ease-out">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter your verses"
              aria-label="Filter your verses"
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm"
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="-ml-4 flex min-w-0 flex-1 gap-2 overflow-x-auto pl-4 pr-3 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] [scrollbar-width:none]">
              {tags.length > 0 &&
                [undefined, ...tags].map((t) => (
                  <button
                    key={t ?? "all"}
                    type="button"
                    onClick={() => setTag(t)}
                    aria-pressed={tag === t}
                    className={cn(
                      "h-8 shrink-0 rounded-full border px-3 text-sm transition-colors",
                      tag === t ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t ? tagLabel(t) : "All"}
                  </button>
                ))}
            </div>
            <button
              type="button"
              onClick={toggleSort}
              aria-label={`Sorted ${sort === "recent" ? "by most recent" : "by book"}. Change`}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowDownUp className="size-3.5" aria-hidden />
              {sort === "recent" ? "Recent" : "Book"}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyLibrary archived={archived} />
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-muted-foreground">No verses match.</p>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTag(undefined);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary hover:bg-muted"
            >
              <X className="size-4" aria-hidden /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-1 flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.book || "all"} aria-label={g.book || undefined}>
              {g.book && (
                <h2 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
                  {g.book}
                  <span className="text-xs">{g.verses.length}</span>
                </h2>
              )}
              <ul className="flex flex-col gap-3">
                {g.verses.map((v, i) => (
                  <li key={v.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    <TextCard v={v} href={`/verses/${v.id}`} onOpen={rememberSpot} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!archived && (
        <>
          {/* keeps the last card clear of the floating button */}
          <div className="h-20" aria-hidden />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
            <div className="mx-auto flex max-w-xl justify-end px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Link
                href="/verses/new"
                transitionTypes={["nav-forward"]}
                aria-label="Add verse"
                className="pointer-events-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="size-6" aria-hidden />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}



// A verse with a card shows its background, photo and font here too.
// Without an href it's a still preview (the card editor shows one).
export function TextCard({ v, href, onOpen }: { v: LibraryItem; href?: string; onOpen?: () => void }) {
  const card = v.card;
  const colors = card ? cardColors(card.bg, card.text) : {};
  const styled = Boolean(colors.bg || colors.fg);
  const quiet = styled ? "opacity-70" : "text-muted-foreground";
  const body = (
    <>
      {card && <CardBackdrop style={card} sizes="36rem" />}
      {card ? (
        <p className="font-brand text-lg font-semibold leading-tight tracking-tight">{v.localReference ?? v.reference}</p>
      ) : (
        <Morph name={morphName.reference(v.id)}>
          <p className="w-fit font-brand text-lg font-semibold leading-tight tracking-tight">{v.localReference ?? v.reference}</p>
        </Morph>
      )}
      <p className={cn("text-xs", quiet)}>
        {v.translation}
        {v.localReference && ` · ${v.reference}`}
      </p>
      <Morph name={morphName.text(v.id)}>
      <p
        className={cn(
          "mt-2.5 line-clamp-3",
          card ? cardFontClass(card.font) : "font-serif",
          card?.font === "hand" ? "text-[1.3rem] leading-snug" : "text-[1.05rem] leading-relaxed",
          !styled && "text-foreground/85",
        )}
        style={card?.bg.kind === "image" ? { textShadow: "0 1px 10px rgb(0 0 0 / 0.35)" } : undefined}
      >
        {v.text}
      </p>
      </Morph>
      {v.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {v.tags.map((t) => (
            <span key={t} className={quiet}>
              {tagLabel(t)}
            </span>
          ))}
        </div>
      )}
    </>
  );
  const surface = "@container relative isolate block overflow-hidden rounded-2xl p-4";
  if (!href)
    return (
      <Morph name={morphName.surface(v.id)} fill>
        <div style={{ backgroundColor: colors.bg, color: colors.fg }} className={cn(surface, !styled && "border bg-card")}>
          {body}
        </div>
      </Morph>
    );
  return (
    <Morph name={morphName.surface(v.id)} fill>
    <Link
      href={href}
      onClick={onOpen}
      transitionTypes={["nav-forward"]}
      style={{ backgroundColor: colors.bg, color: colors.fg }}
      className={cn(
        surface,
        "transition-[transform,background-color] active:scale-[0.99]",
        styled ? "hover:brightness-105" : "border bg-card hover:bg-muted/40",
      )}
    >
      {body}
    </Link>
    </Morph>
  );
}

function EmptyLibrary({ archived }: { archived: boolean }) {
  if (archived) return <p className="py-16 text-center text-muted-foreground">Nothing archived.</p>;
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <h2 className="text-lg font-medium">No verses yet</h2>
      <p className="max-w-xs text-muted-foreground">Save a verse you want to learn by heart, or find one in the Bible.</p>
      <div className="mt-2 flex gap-2">
        <Link href="/verses/new" transitionTypes={["nav-forward"]} className={cn(buttonVariants(), "h-11 px-5 text-base")}>
          Add a verse
        </Link>
        <Link
          href="/bible"
          transitionTypes={["nav-forward"]}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-base")}
        >
          Open the Bible
        </Link>
      </div>
    </section>
  );
}
