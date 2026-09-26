import "server-only";
import { and, arrayContains, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { verses } from "@/lib/db/schema";

// Every query here filters by userId: RLS doesn't apply to the app's direct connection.

// Active verses in Bible order; archived ones most recently archived first.
export async function listVerses(userId: string, opts: { tag?: string; archived?: boolean } = {}) {
  const order = opts.archived
    ? [desc(verses.archivedAt)]
    : [asc(verses.bookNumber), asc(verses.chapter), asc(verses.verseStart)];

  return db
    .select()
    .from(verses)
    .where(
      and(
        eq(verses.userId, userId),
        opts.archived ? isNotNull(verses.archivedAt) : isNull(verses.archivedAt),
        opts.tag ? arrayContains(verses.tags, [opts.tag]) : undefined,
      ),
    )
    .orderBy(...order);
}

export async function getVerse(userId: string, id: string) {
  const [verse] = await db
    .select()
    .from(verses)
    .where(and(eq(verses.userId, userId), eq(verses.id, id)))
    .limit(1);
  return verse ?? null;
}

export async function listTags(userId: string) {
  const rows = await db
    .selectDistinct({ tag: sql<string>`unnest(${verses.tags})` })
    .from(verses)
    .where(and(eq(verses.userId, userId), isNull(verses.archivedAt)));
  return rows.map((r) => r.tag).sort((a, b) => a.localeCompare(b));
}

export async function verseCounts(userId: string) {
  const [counts] = await db
    .select({
      active: sql<number>`count(*) filter (where ${verses.archivedAt} is null)::int`,
      fresh: sql<number>`count(*) filter (where ${verses.archivedAt} is null and ${verses.srs} is null)::int`,
      archived: sql<number>`count(*) filter (where ${verses.archivedAt} is not null)::int`,
    })
    .from(verses)
    .where(eq(verses.userId, userId));
  return counts;
}

// Default the add form to whichever translation was used most recently.
export async function lastTranslation(userId: string) {
  const [row] = await db
    .select({ translation: verses.translation })
    .from(verses)
    .where(eq(verses.userId, userId))
    .orderBy(desc(verses.createdAt))
    .limit(1);
  return row?.translation;
}

// Saved verses in one chapter, to mark them in the Bible reader.
export async function versesInChapter(userId: string, bookNumber: number, chapter: number) {
  return db
    .select({ id: verses.id, verseStart: verses.verseStart, verseEnd: verses.verseEnd, translation: verses.translation })
    .from(verses)
    .where(
      and(
        eq(verses.userId, userId),
        eq(verses.bookNumber, bookNumber),
        eq(verses.chapter, chapter),
        isNull(verses.archivedAt),
      ),
    );
}
