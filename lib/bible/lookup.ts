import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { bibleVerses } from "@/lib/db/schema";
import type { ParsedReference } from "./books";
import type { LookupTranslation } from "./translations";

export type Passage = {
  text: string;
  // The range the text actually covers; wider than asked when the translation merges verses.
  verseStart: number;
  verseEnd: number;
  // Requested verses the translation leaves out (e.g. ESV omits Acts 8:37).
  omitted: number[];
};

export async function getPassage(translation: LookupTranslation, ref: ParsedReference): Promise<Passage | null> {
  const start = ref.verseStart;
  const end = ref.verseEnd ?? ref.verseStart;

  const rows = await db
    .select({ verse: bibleVerses.verse, verseEnd: bibleVerses.verseEnd, text: bibleVerses.text })
    .from(bibleVerses)
    .where(
      and(
        eq(bibleVerses.translation, translation),
        eq(bibleVerses.bookNumber, ref.book.number),
        eq(bibleVerses.chapter, ref.chapter),
        lte(bibleVerses.verse, end),
        gte(bibleVerses.verseEnd, start),
      ),
    )
    .orderBy(asc(bibleVerses.verse));

  if (rows.length === 0) return null;

  const covered = new Set<number>();
  for (const r of rows) for (let v = r.verse; v <= r.verseEnd; v++) covered.add(v);
  const omitted: number[] = [];
  for (let v = start; v <= end; v++) if (!covered.has(v)) omitted.push(v);

  return {
    text: rows.map((r) => r.text).join(" "),
    verseStart: rows[0].verse,
    verseEnd: rows[rows.length - 1].verseEnd,
    omitted,
  };
}

// A whole chapter. Merged verses (MBBTAG) come back as one row covering verse..verseEnd.
export async function getChapter(translation: LookupTranslation, bookNumber: number, chapter: number) {
  return db
    .select({ verse: bibleVerses.verse, verseEnd: bibleVerses.verseEnd, text: bibleVerses.text })
    .from(bibleVerses)
    .where(
      and(
        eq(bibleVerses.translation, translation),
        eq(bibleVerses.bookNumber, bookNumber),
        eq(bibleVerses.chapter, chapter),
      ),
    )
    .orderBy(asc(bibleVerses.verse));
}
