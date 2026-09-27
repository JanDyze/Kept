"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlignLeft, Eye, EyeOff, MapPin, Plus, Search, X } from "lucide-react";
import { CardBackdrop, cardFontClass } from "@/components/memory-card";
import { buttonVariants } from "@/components/ui/button";
import { cardColors, type CardStyle } from "@/lib/cards/style";
import { cn } from "@/lib/utils";
import { tagLabel } from "@/lib/verses/tag-label";
import { VIEW_COOKIE, type LibraryView } from "@/lib/verses/view";

export type LibraryItem = {
  id: string;
  reference: string;
  localReference: string | null; // Tagalog book name for MBBTAG verses
  book: string;
  translation: string;
  text: string;
  tags: string[];
  card: CardStyle | null; // shown in its colors, photo and font when set
};


// Saved for a year so the page renders in the same mode next time, with no flash.
function rememberView(view: LibraryView) {
  document.cookie = `${VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`;
}

export function VerseLibrary({
  items,
  archived,
  initialView,
  initialTag,
}: {
  items: LibraryItem[];
  archived: boolean;
  initialView: LibraryView;
  initialTag?: string;
}) {
  const [view, setView] = useState<LibraryView>(initialView);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | undefined>(initialTag);
  const [peeking, setPeeking] = useState<Set<string>>(new Set());

  function chooseView(next: LibraryView) {
    setView(next);
    setPeeking(new Set());
    rememberView(next);
  }

  function togglePeek(id: string) {
    setPeeking((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }


  const tags = useMemo(() => [...new Set(items.flatMap((v) => v.tags))].sort(), [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (v) =>
        (!tag || v.tags.includes(tag)) &&
        (!q ||
          v.reference.toLowerCase().includes(q) ||
          v.localReference?.toLowerCase().includes(q) ||
          v.tags.some((t) => t.includes(q)) ||
          (view === "text" && v.text.toLowerCase().includes(q))),
    );
  }, [items, tag, query, view]);

  // Group consecutive verses by book (the list arrives in Bible order).
  const groups = useMemo(() => {
    const out: { book: string; verses: LibraryItem[] }[] = [];
    for (const v of shown) {
      const last = out[out.length - 1];
      if (last?.book === v.book) last.verses.push(v);
      else out.push({ book: v.book, verses: [v] });
    }
    return out;
  }, [shown]);

  const filtering = Boolean(query || tag);

  return (
    <>
      {items.length > 0 && (
        <div className="sticky top-16 z-20 -mx-4 -mt-2 flex flex-col gap-3 bg-background/85 px-4 pb-3 pt-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={view === "reference" ? "Filter by reference or tag" : "Filter your verses"}
                aria-label="Filter your verses"
                className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm"
              />
            </label>
            <div className="inline-flex shrink-0 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Show">
              {(
                [
                  ["text", AlignLeft, "Text"],
                  ["reference", MapPin, "Reference"],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  aria-label={label}
                  onClick={() => chooseView(v)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-muted-foreground",
                    "transition-[background-color,color,box-shadow] duration-300 ease-out",
                    view === v && "bg-background text-foreground shadow-sm",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
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
            </div>
          )}
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
            <section key={g.book} aria-label={g.book}>
              <h2 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
                {g.book}
                <span className="text-xs">{g.verses.length}</span>
              </h2>
              <ul className={cn("flex flex-col", view === "reference" ? "gap-2" : "gap-3")}>
                {g.verses.map((v, i) => (
                  <li key={v.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    {view === "text" ? (
                      <TextCard v={v} href={`/verses/${v.id}`} />
                    ) : (
                      <ReferenceRow v={v} open={peeking.has(v.id)} onPeek={() => togglePeek(v.id)} />
                    )}
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
export function TextCard({ v, href }: { v: LibraryItem; href?: string }) {
  const card = v.card;
  const colors = card ? cardColors(card.bg, card.text) : {};
  const styled = Boolean(colors.bg || colors.fg);
  const quiet = styled ? "opacity-70" : "text-muted-foreground";
  const body = (
    <>
      {card && <CardBackdrop style={card} sizes="36rem" />}
      <p className="font-brand text-lg font-semibold leading-tight tracking-tight">{v.localReference ?? v.reference}</p>
      <p className={cn("text-xs", quiet)}>
        {v.translation}
        {v.localReference && ` · ${v.reference}`}
      </p>
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
      <div style={{ backgroundColor: colors.bg, color: colors.fg }} className={cn(surface, !styled && "border bg-card")}>
        {body}
      </div>
    );
  return (
    <Link
      href={href}
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
  );
}

// References only: where to find the verse, with an eye button to peek at the text.
function ReferenceRow({
  v,
  open,
  onPeek,
}: {
  v: LibraryItem;
  open: boolean;
  onPeek: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2 py-2 pl-4 pr-2">
        <Link href={`/verses/${v.id}`} transitionTypes={["nav-forward"]} className="min-w-0 flex-1 py-1.5">
          <span className="block truncate font-brand text-lg font-semibold leading-tight tracking-tight">
            {v.localReference ?? v.reference}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {v.translation}
            {v.localReference && ` · ${v.reference}`}
          </span>
        </Link>
        <button
          type="button"
          onClick={onPeek}
          aria-expanded={open}
          aria-label={open ? `Hide ${v.reference}` : `Peek at ${v.reference}`}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {open ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      {open && (
        <p className="animate-rise border-t px-4 py-3 font-serif text-[1.05rem] leading-relaxed text-foreground/85">{v.text}</p>
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
