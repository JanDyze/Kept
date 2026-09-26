import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Screen } from "@/components/screen";
import { readTranslation, TranslationToggle } from "@/components/translation-toggle";
import { requireUser } from "@/lib/auth";
import { bookBySlug, bookSlug } from "@/lib/bible/books";

export async function generateMetadata({ params }: PageProps<"/bible/[book]">): Promise<Metadata> {
  return { title: bookBySlug((await params).book)?.name };
}

export default async function BookPage({ params, searchParams }: PageProps<"/bible/[book]">) {
  await requireUser();
  const book = bookBySlug((await params).book);
  if (!book) notFound();
  const t = readTranslation((await searchParams).t);
  const path = `/bible/${bookSlug(book)}`;

  return (
    <Screen
      back={{ href: `/bible?t=${t}`, label: "Bible" }}
      title={t === "MBBTAG" ? book.tl : book.name}
      subtitle={t === "MBBTAG" && book.tl !== book.name ? book.name : `${book.verses.length} ${book.verses.length === 1 ? "chapter" : "chapters"}`}
      action={<TranslationToggle current={t} path={path} />}
    >
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {book.verses.map((_, i) => (
          <li key={i}>
            <Link
              href={`${path}/${i + 1}?t=${t}`}
              transitionTypes={["nav-forward"]}
              className="flex aspect-square items-center justify-center rounded-xl border bg-card text-lg font-medium transition-[transform,background-color] hover:bg-muted/50 active:scale-95"
            >
              {i + 1}
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
