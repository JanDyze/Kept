import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Check, Users } from "lucide-react";
import { CardGallery } from "@/components/card-gallery";
import { KeepButton, KeptNotice } from "@/components/keep-button";
import { Screen } from "@/components/screen";
import { SearchBox } from "@/components/search-box";
import { readTranslation, TranslationToggle } from "@/components/translation-toggle";
import { requireUser } from "@/lib/auth";
import { BOOKS, bookSlug } from "@/lib/bible/books";
import { searchVerses, type SearchHit } from "@/lib/search";
import { popularVerses } from "@/lib/search/popular";
import { pendingRequestCount } from "@/lib/social/friends";
import { galleryCards } from "@/lib/social/gallery";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Discover" };

const SUGGESTIONS = [
  "anxiety",
  "depression",
  "grief",
  "birthdays",
  "mothers",
  "fathers",
  "marriage",
  "new job",
  "strength",
  "forgiveness",
  "healing",
  "kaarawan",
];

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const t = readTranslation(sp.t);
  // Without a search: the card gallery (default) or popular verses.
  const view = sp.view === "verses" ? "verses" : "cards";
  const who = sp.who === "friends" ? "friends" : "all";
  const browsing = !q.trim();
  const [result, popular, cards, requests] = await Promise.all([
    q.trim() ? searchVerses(q, t, user.id) : null,
    browsing && view === "verses" ? popularVerses(t, user.id) : [],
    browsing && view === "cards" ? galleryCards(user.id, { scope: who }) : [],
    pendingRequestCount(user.id),
  ]);
  const total = result ? result.hits.length + result.textHits.length : 0;

  return (
    <Screen
      back={{ href: "/", label: "Home" }}
      title="Discover"
      action={
        <div className="flex items-center gap-1">
          {(!browsing || view === "verses") && (
            <TranslationToggle current={t} path="/search" params={q ? { q } : { view: "verses" }} />
          )}
          <Link
            href="/friends"
            transitionTypes={["nav-forward"]}
            aria-label={requests ? `Friends, ${requests} waiting` : "Friends"}
            className="relative flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Users className="size-5" aria-hidden />
            {requests > 0 && (
              <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] leading-4 font-semibold text-primary-foreground">
                {requests}
              </span>
            )}
          </Link>
        </div>
      }
    >
      <SearchBox defaultValue={q} translation={t} />

      {!result && (
        <div role="tablist" aria-label="Browse" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["cards", "verses"] as const).map((v) => (
            <Link
              key={v}
              role="tab"
              aria-selected={view === v}
              href={v === "cards" ? "/search" : `/search?${new URLSearchParams({ view: "verses", t })}`}
              replace
              scroll={false}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-[background-color,color,box-shadow]",
                view === v ? "bg-background text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "cards" ? "Cards" : "Verses"}
            </Link>
          ))}
        </div>
      )}

      {!result && view === "cards" && (
        <section aria-label="Cards" className="mt-4">
          <div className="mb-4 flex gap-2">
            {(["all", "friends"] as const).map((w) => (
              <Link
                key={w}
                href={w === "all" ? "/search" : "/search?who=friends"}
                replace
                scroll={false}
                aria-current={who === w ? "true" : undefined}
                className={cn(
                  "h-8 rounded-full border px-3 text-sm leading-[1.875rem] transition-colors",
                  who === w ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                {w === "all" ? "Everyone" : "Friends"}
              </Link>
            ))}
          </div>
          {cards.length > 0 ? (
            <CardGallery cards={cards} viewerId={user.id} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-12 text-center">
              <p className="text-muted-foreground">{who === "friends" ? "No cards from friends yet." : "No shared cards yet."}</p>
              <Link
                href={who === "friends" ? "/friends" : "/verses"}
                transitionTypes={["nav-forward"]}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {who === "friends" ? "Add friends" : "Share one of yours"}
              </Link>
            </div>
          )}
        </section>
      )}

      {!result && view === "verses" && (
        <>
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`/search?${new URLSearchParams({ q: s, t })}`}
                className="shrink-0 rounded-full border border-input px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s}
              </Link>
            ))}
          </div>

          {popular.length > 0 && (
            <section className="mt-7" aria-labelledby="popular">
              <h2 id="popular" className="font-brand text-xl font-semibold tracking-tight">
                Popular
              </h2>
              <Results hits={popular} translation={t} ranked />
            </section>
          )}
        </>
      )}

      {result && (
        <>
          {result.topics.length > 0 && (
            <p className="mt-5 text-sm text-muted-foreground">
              Verses about <span className="text-foreground">{result.topics.slice(0, 4).join(", ")}</span>
            </p>
          )}
          {total === 0 && (
            <p className="mt-8 text-muted-foreground">
              Nothing found for “{q}”. Try a simpler word, like <em>fear</em>, <em>hope</em> or <em>family</em>.
            </p>
          )}
          <Results hits={result.hits} translation={t} />
          {result.textHits.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-medium text-muted-foreground">Verses containing “{q.trim()}”</h2>
              <Results hits={result.textHits} translation={t} />
            </>
          )}
        </>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Topics from the{" "}
        <a href="https://www.openbible.info/topics/" className="underline underline-offset-2" target="_blank" rel="noreferrer">
          OpenBible.info Topical Bible
        </a>{" "}
        (CC BY). Always read a verse in its context.
      </p>
      <KeptNotice />
    </Screen>
  );
}

function Results({
  hits,
  translation,
  ranked,
}: {
  hits: (SearchHit & { keptBy?: number })[];
  translation: "ESV" | "MBBTAG";
  ranked?: boolean; // numbered, for the Popular list
}) {
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {hits.map((h, i) => {
        const book = BOOKS[h.bookNumber - 1];
        const shownRef = translation === "MBBTAG" ? h.reference.replace(book.name, book.tl) : h.reference;
        return (
          <li
            key={`${h.bookNumber}:${h.chapter}:${h.verseStart}`}
            className="animate-rise rounded-2xl border bg-card p-4"
            style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium">
                {ranked && <span className="mr-2 font-brand text-muted-foreground">{i + 1}</span>}
                {shownRef}
                {translation === "MBBTAG" && shownRef !== h.reference && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{h.reference}</span>
                )}
              </p>
              {Boolean(h.keptBy) && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Kept by {h.keptBy} {h.keptBy === 1 ? "other" : "others"}
                </span>
              )}
            </div>
            <p className="mt-1.5 font-serif text-[1.05rem] leading-relaxed">{h.text}</p>
            <div className="mt-3 flex items-center gap-2">
              {h.saved ? (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground">
                  <Check className="size-4" aria-hidden /> Kept
                </span>
              ) : (
                <KeepButton reference={h.reference} translation={translation} />
              )}
              <Link
                href={`/bible/${bookSlug(book)}/${h.chapter}?t=${translation}#v${h.verseStart}`}
                transitionTypes={["nav-forward"]}
                className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <BookOpen className="size-4" aria-hidden /> Read in context
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
