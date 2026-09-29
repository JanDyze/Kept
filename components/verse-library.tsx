"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownUp, BadgeCheck, Check, ChevronDown, ChevronRight, GripVertical, Plus, Search, Star, X } from "lucide-react";
import { saveVerseOrder } from "@/app/verses/actions";
import { ArrangeList } from "@/components/arrange-list";
import { CardBackdrop, CardBorder, cardFontClass } from "@/components/memory-card";
import { Morph, morphName } from "@/components/verse-morph";
import { buttonVariants } from "@/components/ui/button";
import { formatReference, parseReference } from "@/lib/bible/books";
import { cardColors, hasBorder, type CardStyle } from "@/lib/cards/style";
import type { Mastery } from "@/lib/verses/mastery";
import { currentPath, rememberList, takeListMemory, type ListMemory } from "@/lib/scroll-memory";
import { rememberVerseOrder } from "@/lib/verse-order";
import { cn } from "@/lib/utils";
import { tagLabel } from "@/lib/verses/tag-label";
import { orderBy } from "@/lib/verses/order";
import { LIBRARY_SORTS, SORT_COOKIE, type LibrarySort } from "@/lib/verses/view";

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
  position?: number | null; // place in the user's own order; null (not yet placed) sits first
  starred?: boolean; // kept at the top whatever the order
  mastery?: Mastery; // shown at the tile's foot in My verses
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
  // Arranging: the full list as compact rows to reorder; saved positions apply at once.
  const [arranging, setArranging] = useState(false);
  const [positions, setPositions] = useState<Map<string, number> | null>(null);
  const [saving, startSaving] = useTransition();
  const [arrangeError, setArrangeError] = useState<string | null>(null);

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

  function chooseSort(next: LibrarySort) {
    setSort(next);
    rememberSort(next);
  }

  function finishArranging(ids: string[]) {
    setArrangeError(null);
    startSaving(async () => {
      const result = await saveVerseOrder(ids);
      if (result.error) return setArrangeError(result.error);
      setPositions(new Map(ids.map((id, i) => [id, i])));
      chooseSort("mine");
      setArranging(false);
      window.scrollTo(0, 0);
    });
  }

  const tags = useMemo(() => [...new Set(items.flatMap((v) => v.tags))].sort(), [items]);
  const ordered = useMemo(() => orderBy(items, sort, positions), [items, sort, positions]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter(
      (v) =>
        (!tag || v.tags.includes(tag)) &&
        (!q ||
          v.reference.toLowerCase().includes(q) ||
          v.localReference?.toLowerCase().includes(q) ||
          v.tags.some((t) => t.includes(q)) ||
          v.text.toLowerCase().includes(q)),
    );
  }, [ordered, tag, query]);

  // Opening a verse: remember the spot to come back to, and the order shown, for swiping.
  const rememberSpot = () => {
    rememberList(currentPath(), { y: window.scrollY, query, tag });
    rememberVerseOrder(shown.map((v) => v.id));
  };

  // By book: consecutive verses grouped under their book, starred ones in their own group first.
  // Recent: one list, newest first (starred at the top).
  const groups = useMemo(() => {
    if (sort !== "book") return [{ book: "", verses: shown }];
    const out: { book: string; verses: LibraryItem[] }[] = [];
    for (const v of shown) {
      const book = v.starred ? "Starred" : v.book;
      const last = out[out.length - 1];
      if (last?.book === book) last.verses.push(v);
      else out.push({ book, verses: [v] });
    }
    return out;
  }, [shown, sort]);

  const filtering = Boolean(query || tag);

  if (arranging)
    return (
      <ArrangeList
        items={ordered}
        saving={saving}
        error={arrangeError}
        onCancel={() => {
          setArrangeError(null);
          setArranging(false);
        }}
        onDone={finishArranging}
      />
    );

  return (
    <>
      {items.length > 0 && (
        <div className="sticky top-(--header-offset) z-20 -mx-4 -mt-2 flex flex-col gap-3 bg-background/85 px-4 pb-3 pt-3 backdrop-blur-md transition-[top] duration-300 ease-out">
          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1">
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
            <SortMenu
              value={sort}
              onChange={chooseSort}
              onArrange={
                !archived && items.length > 1
                  ? () => {
                      setArranging(true);
                      window.scrollTo(0, 0);
                    }
                  : undefined
              }
            />
          </div>

          {tags.length > 0 && (
            <TagStrip>
              {[undefined, ...tags].map((t) => (
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
            </TagStrip>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyLibrary archived={archived} />
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-muted-foreground">No verses match.</p>
          {!archived && query.trim() && <AddFromSearch query={query.trim()} />}
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



// The tag chips, scrolling sideways when they don't fit: the side with more to see fades out, and
// a chevron at the right end scrolls on.
function TagStrip({ children }: { children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const measure = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, [children]);
  const fade = `linear-gradient(to right, ${more.left ? "transparent 1rem, black 3rem" : "black"}, ${more.right ? "black calc(100% - 4.5rem), transparent calc(100% - 2.5rem)" : "black"})`;

  return (
    <div className="relative -mx-4">
      <div
        ref={row}
        className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        {children}
      </div>
      {more.right && (
        <button
          type="button"
          aria-label="More tags"
          onClick={() => row.current?.scrollBy({ left: row.current.clientWidth * 0.6, behavior: "smooth" })}
          className="animate-fade-in absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

// Recent / Book / My order, as a small menu under the current choice, with Arrange at its foot.
function SortMenu({
  value,
  onChange,
  onArrange,
}: {
  value: LibrarySort;
  onChange: (sort: LibrarySort) => void;
  onArrange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const current = LIBRARY_SORTS.find((s) => s.value === value)!;

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Order: ${current.label}`}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-input bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowDownUp className="size-3.5" aria-hidden />
        {current.label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-rise absolute top-full right-0 z-30 mt-1.5 w-52 rounded-xl border bg-popover p-1 text-popover-foreground shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)]"
        >
          {LIBRARY_SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="menuitemradio"
              aria-checked={s.value === value}
              onClick={() => {
                onChange(s.value);
                setOpen(false);
              }}
              className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm hover:bg-muted"
            >
              {s.label}
              {s.value === value && <Check className="size-4 text-primary" aria-hidden />}
            </button>
          ))}
          {onArrange && (
            <>
              <div className="mx-2 my-1 border-t" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onArrange();
                }}
                className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted"
              >
                <GripVertical className="size-4 text-muted-foreground" aria-hidden /> Arrange my order
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Room between a card's border and the tile's text, per side: an inset frame sits 4cqw in, so the
// text clears it by as much again; a border at the edge needs less. Sides without one keep 1rem.
function borderPadding(card: CardStyle | null): React.CSSProperties | undefined {
  if (!card || !hasBorder(card.border)) return undefined;
  const b = card.border;
  const pad = (on: boolean) => (on ? (b.inset ? "calc(8cqw + 0.25rem)" : "calc(3.5cqw + 0.5rem)") : undefined);
  return { paddingTop: pad(b.top), paddingRight: pad(b.right), paddingBottom: pad(b.bottom), paddingLeft: pad(b.left) };
}

const MASTERY_LABEL = { new: "New", learning: "Learning", mastered: "Mastered" } as const;

// New / Learning / Mastered (lib/verses/mastery.ts), as a small mark at the tile's foot.
function MasteryMark({ level, quiet }: { level: Mastery; quiet: string }) {
  return (
    <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1 font-medium", level === "mastered" ? "opacity-95" : quiet)}>
      {level === "mastered" ? (
        <BadgeCheck className="size-3.5" aria-hidden />
      ) : level === "learning" ? (
        <span className="relative size-3 rounded-full border-[1.5px] border-current" aria-hidden>
          <span className="absolute inset-y-0 left-0 w-1/2 rounded-l-full bg-current" />
        </span>
      ) : (
        <span className="size-3 rounded-full border-[1.5px] border-current" aria-hidden />
      )}
      {MASTERY_LABEL[level]}
    </span>
  );
}

// A verse with a card shows its background, photo and font here too.
// Without an href it's a still preview (the card editor shows one). `full` is the verse page's
// version: larger, with the whole text.
export function TextCard({ v, href, onOpen, full }: { v: LibraryItem; href?: string; onOpen?: () => void; full?: boolean }) {
  const card = v.card;
  const colors = card ? cardColors(card.bg, card.text) : {};
  const styled = Boolean(colors.bg || colors.fg);
  const quiet = styled ? "opacity-70" : "text-muted-foreground";
  const framed = Boolean(card && hasBorder(card.border));
  const body = (
    <>
      {card && <CardBackdrop style={card} sizes="36rem" />}
      {card && <CardBorder style={card} />}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {card ? (
            <p
              className={cn(
                "font-brand font-semibold leading-tight tracking-tight",
                full ? (framed ? "text-xl" : "text-2xl") : framed ? "text-base" : "text-lg",
              )}
            >
              {v.localReference ?? v.reference}
            </p>
          ) : (
            <Morph name={morphName.reference(v.id)}>
              <p className="w-fit font-brand text-lg font-semibold leading-tight tracking-tight">{v.localReference ?? v.reference}</p>
            </Morph>
          )}
          <p className={cn("text-xs", quiet)}>
            {v.translation}
            {v.localReference && ` · ${v.reference}`}
          </p>
        </div>
        {v.starred && <Star className="mt-0.5 size-4 shrink-0 fill-current text-icon-accent" aria-label="Starred" />}
      </div>
      <Morph name={morphName.text(v.id)}>
      <p
        className={cn(
          full ? "mt-4 whitespace-pre-line" : "mt-2.5 line-clamp-3",
          card ? cardFontClass(card.font) : "font-serif",
          full
            ? card?.font === "hand"
              ? framed
                ? "text-[1.5rem] leading-snug"
                : "text-[1.65rem] leading-snug"
              : framed
                ? "text-[1.2rem] leading-relaxed"
                : "text-[1.35rem] leading-relaxed"
            : card?.font === "hand"
              ? framed
                ? "text-[1.15rem] leading-snug"
                : "text-[1.3rem] leading-snug"
              : framed
                ? "text-[0.95rem] leading-relaxed"
                : "text-[1.05rem] leading-relaxed",
          !styled && "text-foreground/85",
        )}
        style={card?.bg.kind === "image" ? { textShadow: "0 1px 10px rgb(0 0 0 / 0.35)" } : undefined}
      >
        {v.text}
      </p>
      </Morph>
      {(v.tags.length > 0 || v.mastery) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {v.tags.map((t) => (
            <span key={t} className={cn("font-medium", quiet)}>
              #{tagLabel(t)}
            </span>
          ))}
          {v.mastery && <MasteryMark level={v.mastery} quiet={quiet} />}
        </div>
      )}
    </>
  );
  const surface = cn("@container relative isolate block overflow-hidden rounded-2xl", full ? "p-5" : "p-4");
  const padding = borderPadding(card);
  if (!href)
    return (
      <Morph name={morphName.surface(v.id)} fill>
        <div style={{ backgroundColor: colors.bg, color: colors.fg, ...padding }} className={cn(surface, !styled && "border bg-card")}>
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
      style={{ backgroundColor: colors.bg, color: colors.fg, ...padding }}
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

// Searching My verses for one that isn't there: add it. A reference ("jn 3 16") opens Add verse
// filled in; other words can also be looked up in the Bible.
function AddFromSearch({ query }: { query: string }) {
  const parsed = parseReference(query);
  const reference = parsed.ok
    ? formatReference(parsed.ref.book.name, parsed.ref.chapter, parsed.ref.verseStart, parsed.ref.verseEnd)
    : null;
  return (
    <div className="flex flex-col items-center gap-1">
      <Link
        href={reference ? `/verses/new?ref=${encodeURIComponent(reference)}&from=verses` : "/verses/new"}
        transitionTypes={["nav-forward"]}
        className={cn(buttonVariants(), "h-11 gap-1.5 px-5 text-base")}
      >
        <Plus className="size-5" aria-hidden /> {reference ? `Add ${reference}` : "Add a verse"}
      </Link>
      {!reference && (
        <Link
          href={`/bible/search?q=${encodeURIComponent(query)}`}
          transitionTypes={["nav-forward"]}
          className="inline-flex h-10 max-w-full items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary hover:bg-muted"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Find &ldquo;{query}&rdquo; in the Bible</span>
        </Link>
      )}
    </div>
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
