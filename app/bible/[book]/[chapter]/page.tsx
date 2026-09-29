import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChapterReader } from "@/components/chapter-reader";
import { Screen } from "@/components/screen";
import { readTranslation, TranslationToggle } from "@/components/translation-toggle";
import { requireUser } from "@/lib/auth";
import { adjacentChapter, bookBySlug, bookSlug } from "@/lib/bible/books";
import { getChapter } from "@/lib/bible/lookup";
import { versesInChapter } from "@/lib/verses/queries";

export async function generateMetadata({ params }: PageProps<"/bible/[book]/[chapter]">): Promise<Metadata> {
  const { book, chapter } = await params;
  const b = bookBySlug(book);
  return { title: b ? `${b.name} ${chapter}` : undefined };
}

export default async function ChapterPage({ params, searchParams }: PageProps<"/bible/[book]/[chapter]">) {
  const user = await requireUser();
  const { book: slug, chapter: ch } = await params;
  const book = bookBySlug(slug);
  const chapter = Number(ch);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.verses.length) notFound();
  const t = readTranslation((await searchParams).t);

  const [rows, saved] = await Promise.all([getChapter(t, book.number, chapter), versesInChapter(user.id, book.number, chapter)]);
  const prev = adjacentChapter(book, chapter, -1);
  const next = adjacentChapter(book, chapter, 1);
  const name = t === "MBBTAG" ? book.tl : book.name;
  const path = `/bible/${bookSlug(book)}/${chapter}`;

  return (
    <Screen
      back={{ href: `/bible/${bookSlug(book)}?t=${t}`, label: name }}
      title={`${name} ${chapter}`}
      subtitle={t === "MBBTAG" && book.tl !== book.name ? `${book.name} ${chapter}` : undefined}
      action={<TranslationToggle current={t} path={path} />}
    >
      {rows.length === 0 ? (
        <p className="text-muted-foreground">This chapter isn&apos;t in your {t} copy.</p>
      ) : (
        <ChapterReader
          bookName={book.name}
          chapter={chapter}
          translation={t}
          rows={rows}
          saved={saved.map((v) => ({ start: v.verseStart, end: v.verseEnd ?? v.verseStart, id: v.id }))}
        />
      )}

      {/* Chapter to chapter replaces the page, so Back leaves the Bible instead of paging back. */}
      <nav className="mt-10 flex justify-between gap-3" aria-label="Chapters">
        {prev ? (
          <Link
            href={`/bible/${bookSlug(prev.book)}/${prev.chapter}?t=${t}`}
            replace
            transitionTypes={["nav-back"]}
            className="inline-flex h-11 items-center gap-1 rounded-xl border px-4 text-sm hover:bg-muted"
          >
            <ChevronLeft className="size-4" aria-hidden /> {t === "MBBTAG" ? prev.book.tl : prev.book.name} {prev.chapter}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/bible/${bookSlug(next.book)}/${next.chapter}?t=${t}`}
            replace
            transitionTypes={["nav-forward"]}
            className="inline-flex h-11 items-center gap-1 rounded-xl border px-4 text-sm hover:bg-muted"
          >
            {t === "MBBTAG" ? next.book.tl : next.book.name} {next.chapter} <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </nav>
    </Screen>
  );
}
