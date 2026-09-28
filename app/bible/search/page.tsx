import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { Screen } from "@/components/screen";
import { readTranslation, TranslationToggle } from "@/components/translation-toggle";
import { requireUser } from "@/lib/auth";
import { BOOKS, bookSlug, findBook, formatReference, parseReference } from "@/lib/bible/books";
import { searchBibleText } from "@/lib/search";

export const metadata: Metadata = { title: "Search the Bible" };

const EXAMPLES = ["John 3:16", "Psalm 23", "Juan 14", "Romans", "love one another", "Salita"];

// Finds a passage, unlike Discover (which finds verses about a topic):
// a reference or chapter jumps there, a book name opens it, anything else searches the words.
export default async function BibleSearchPage({ searchParams }: PageProps<"/bible/search">) {
  await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const t = readTranslation(sp.t);

  if (q) {
    const ref = parseReference(q);
    if (ref.ok) redirect(`/bible/${bookSlug(ref.ref.book)}/${ref.ref.chapter}?t=${t}#v${ref.ref.verseStart}`);
    const chapterOnly = q.match(/^(.+?)\s*(\d+)$/);
    const chapterBook = chapterOnly && findBook(chapterOnly[1]);
    if (chapterBook && Number(chapterOnly[2]) >= 1 && Number(chapterOnly[2]) <= chapterBook.verses.length) {
      redirect(`/bible/${bookSlug(chapterBook)}/${Number(chapterOnly[2])}?t=${t}`);
    }
    const book = findBook(q);
    if (book) redirect(`/bible/${bookSlug(book)}?t=${t}`);
  }

  const result = q.length >= 2 ? await searchBibleText(q, t) : null;
  const highlight = q ? new RegExp(`(?<!\\p{L})(${escapeRegex(q).replace(/\s+/g, "\\s+")})(?!\\p{L})`, "giu") : null;

  return (
    <Screen
      back={{ href: `/bible?t=${t}`, label: "Bible" }}
      title="Search"
      subtitle={t === "MBBTAG" ? "Magandang Balita Biblia" : "English Standard Version"}
      action={<TranslationToggle current={t} path="/bible/search" params={q ? { q } : undefined} />}
    >
      <Form action="/bible/search" role="search" className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Reference, book or words"
          placeholder="John 3:16, Psalm 23, or words"
          className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-base outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <input type="hidden" name="t" value={t} />
      </Form>

      {!result && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <Link
                key={e}
                href={`/bible/search?${new URLSearchParams({ q: e, t })}`}
                className="rounded-full border border-input px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {e}
              </Link>
            ))}
          </div>
        </>
      )}

      {result && (
        <>
          <p className="mt-5 text-sm text-muted-foreground">
            {result.total === 0
              ? `No verses in ${t} contain “${q}”.`
              : `${result.total.toLocaleString()} ${result.total === 1 ? "verse contains" : "verses contain"} “${q}”${result.total > result.rows.length ? `, showing the first ${result.rows.length}` : ""}.`}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {result.rows.map((r) => {
              const book = BOOKS[r.bookNumber - 1];
              const name = t === "MBBTAG" ? book.tl : book.name;
              return (
                <li key={`${r.bookNumber}:${r.chapter}:${r.verse}`}>
                  <Link
                    href={`/bible/${bookSlug(book)}/${r.chapter}?t=${t}#v${r.verse}`}
                    transitionTypes={["nav-forward"]}
                    className="block rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium">{formatReference(name, r.chapter, r.verse, r.verseEnd > r.verse ? r.verseEnd : null)}</p>
                    <p className="mt-1 font-serif text-[1.05rem] leading-relaxed">
                      {highlight
                        ? r.text.split(highlight).map((part, i) =>
                            i % 2 === 1 ? (
                              <mark key={i} className="rounded bg-icon-accent/30 px-0.5 text-foreground">
                                {part}
                              </mark>
                            ) : (
                              part
                            ),
                          )
                        : r.text}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Screen>
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
