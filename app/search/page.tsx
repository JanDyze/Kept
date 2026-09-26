import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkPlus, BookOpen, Check } from "lucide-react";
import { Screen } from "@/components/screen";
import { SearchBox } from "@/components/search-box";
import { readTranslation, TranslationToggle } from "@/components/translation-toggle";
import { requireUser } from "@/lib/auth";
import { BOOKS, bookSlug } from "@/lib/bible/books";
import { searchVerses, type SearchHit } from "@/lib/search";
import { popularVerses } from "@/lib/search/popular";
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
  const [result, popular] = await Promise.all([
    q.trim() ? searchVerses(q, t, user.id) : null,
    q.trim() ? [] : popularVerses(t, user.id),
  ]);
  const total = result ? result.hits.length + result.textHits.length : 0;

  return (
    <Screen
      back={{ href: "/", label: "Home" }}
      title="Discover"
      action={
        <TranslationToggle
          current={t}
          path="/search"
          params={q ? { q } : undefined}
        />
      }
    >
      <SearchBox defaultValue={q} translation={t} autoFocus={!q} />

      {!result && (
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
                <Link
                  href={`/verses/new?${new URLSearchParams({ ref: h.reference, t: translation })}`}
                  transitionTypes={["nav-forward"]}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85"
                >
                  <BookmarkPlus className="size-4" aria-hidden /> Keep
                </Link>
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
