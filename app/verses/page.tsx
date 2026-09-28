import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Screen } from "@/components/screen";
import { VerseLibrary, type LibraryItem } from "@/components/verse-library";
import { requireUser } from "@/lib/auth";
import { bookByName } from "@/lib/bible/books";
import { readCardStyle } from "@/lib/cards/style";
import { listVerses, verseCounts } from "@/lib/verses/queries";
import { SORT_COOKIE, type LibrarySort } from "@/lib/verses/view";

export const metadata: Metadata = { title: "My verses" };

export default async function VersesPage({ searchParams }: PageProps<"/verses">) {
  const user = await requireUser();
  const sp = await searchParams;
  const archived = sp.view === "archived";
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const [list, counts, jar] = await Promise.all([listVerses(user.id, { archived }), verseCounts(user.id), cookies()]);
  const saved = jar.get(SORT_COOKIE)?.value;
  const sort: LibrarySort = saved === "book" || saved === "mine" ? saved : "recent";

  // listVerses returns Bible order (archived: most recently archived first); `bibleOrder` keeps it.
  const items: LibraryItem[] = list.map((v, i) => {
    const tl = v.translation === "MBBTAG" ? bookByName(v.book)?.tl : undefined;
    return {
      id: v.id,
      reference: v.reference,
      localReference: tl && tl !== v.book ? v.reference.replace(v.book, tl) : null,
      book: v.book,
      translation: v.translation,
      text: v.text,
      tags: v.tags,
      card: readCardStyle(v.card),
      bibleOrder: archived ? v.bookNumber * 1e6 + v.chapter * 1e3 + v.verseStart : i,
      addedAt: (archived && v.archivedAt ? v.archivedAt : v.createdAt).getTime(),
      position: v.position,
    };
  });

  return (
    <Screen
      back={archived ? { href: "/verses", label: "My verses" } : { href: "/", label: "Home" }}
      title={archived ? "Archived" : "My verses"}
      subtitle={`${list.length} ${list.length === 1 ? "verse" : "verses"}`}
    >
      <VerseLibrary items={items} archived={archived} initialSort={sort} initialTag={tag} />

      {!archived && counts.archived > 0 && (
        <footer className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/verses?view=archived" transitionTypes={["nav-forward"]} className="py-2 hover:text-foreground">
            Archived ({counts.archived})
          </Link>
        </footer>
      )}
    </Screen>
  );
}
