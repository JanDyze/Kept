import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { Screen } from "@/components/screen";
import { readTranslation, TranslationToggle } from "@/components/translation-toggle";
import { requireUser } from "@/lib/auth";
import { BOOKS, bookSlug } from "@/lib/bible/books";

export const metadata: Metadata = { title: "Bible" };

export default async function BiblePage({ searchParams }: PageProps<"/bible">) {
  await requireUser();
  const t = readTranslation((await searchParams).t);
  const sections = [
    { title: "Old Testament", books: BOOKS.slice(0, 39) },
    { title: "New Testament", books: BOOKS.slice(39) },
  ];

  return (
    <Screen
      back={{ href: "/", label: "Home" }}
      title="Bible"
      subtitle={t === "MBBTAG" ? "Magandang Balita Biblia" : "English Standard Version"}
    >
      {/* Action bar: sticks under the top bar like the one in My verses. */}
      <div className="sticky top-(--header-offset) z-20 transition-[top] duration-300 ease-out -mx-4 -mt-2 mb-3 flex items-center gap-2 bg-background/85 px-4 pb-3 pt-3 backdrop-blur-md">
        <Form action="/bible/search" role="search" className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            name="q"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search the Bible"
            placeholder="Search"
            className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm"
          />
          <input type="hidden" name="t" value={t} />
        </Form>
        <Link
          href={`/search?t=${t}`}
          transitionTypes={["nav-forward"]}
          aria-label="Discover verses by topic"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-input bg-card text-foreground transition-[transform,background-color] hover:bg-muted active:scale-95"
        >
          <Compass className="size-5" aria-hidden />
        </Link>
        <TranslationToggle current={t} path="/bible" />
      </div>

      {sections.map((s) => (
        <section key={s.title} className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{s.title}</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {s.books.map((b) => (
              <li key={b.number}>
                <Link
                  href={`/bible/${bookSlug(b)}?t=${t}`}
                  transitionTypes={["nav-forward"]}
                  className="flex h-full flex-col rounded-xl border bg-card px-3 py-2.5 transition-[transform,background-color] hover:bg-muted/50 active:scale-[0.98]"
                >
                  <span className="font-medium leading-snug">{t === "MBBTAG" ? b.tl : b.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t === "MBBTAG" && b.tl !== b.name ? `${b.name} · ` : ""}
                    {b.verses.length} {b.verses.length === 1 ? "chapter" : "chapters"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Screen>
  );
}
