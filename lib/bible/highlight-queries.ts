import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bibleVerses, highlights, verses } from "@/lib/db/schema";
import { BOOKS, formatReference } from "./books";
import { isHighlightColor, type HighlightColor } from "./highlights";
import type { LookupTranslation } from "./translations";

// A chapter's highlights, verse → color.
export async function chapterHighlights(userId: string, bookNumber: number, chapter: number) {
  const rows = await db
    .select({ verse: highlights.verse, color: highlights.color })
    .from(highlights)
    .where(and(eq(highlights.userId, userId), eq(highlights.bookNumber, bookNumber), eq(highlights.chapter, chapter)));
  const out: Record<number, HighlightColor> = {};
  for (const r of rows) if (isHighlightColor(r.color)) out[r.verse] = r.color;
  return out;
}

export type HighlightedPassage = {
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  color: HighlightColor;
  reference: string; // English, as kept
  text: string;
  kept: boolean; // already one of the user's verses
};

// The newest highlights, run together into passages (neighbouring verses in one color), with
// their text in the given translation and whether they're already kept.
export async function recentHighlights(userId: string, translation: LookupTranslation, limit = 12): Promise<HighlightedPassage[]> {
  const rows = await db
    .select({
      bookNumber: highlights.bookNumber,
      chapter: highlights.chapter,
      verse: highlights.verse,
      color: highlights.color,
      createdAt: highlights.createdAt,
    })
    .from(highlights)
    .where(eq(highlights.userId, userId))
    .orderBy(desc(highlights.createdAt))
    .limit(200);
  if (rows.length === 0) return [];

  // Group by chapter and color, then split into runs of consecutive verses; newest first.
  const groups = new Map<string, { bookNumber: number; chapter: number; color: string; verses: number[]; at: number }>();
  for (const r of rows) {
    const key = `${r.bookNumber}:${r.chapter}:${r.color}`;
    const g = groups.get(key) ?? { bookNumber: r.bookNumber, chapter: r.chapter, color: r.color, verses: [], at: r.createdAt.getTime() };
    g.verses.push(r.verse);
    g.at = Math.max(g.at, r.createdAt.getTime());
    groups.set(key, g);
  }
  const runs: (Omit<HighlightedPassage, "reference" | "text" | "kept" | "color"> & { color: string; at: number })[] = [];
  for (const g of groups.values()) {
    const vs = [...new Set(g.verses)].sort((a, b) => a - b);
    let start = vs[0];
    for (let i = 1; i <= vs.length; i++) {
      if (i === vs.length || vs[i] !== vs[i - 1] + 1) {
        runs.push({ bookNumber: g.bookNumber, chapter: g.chapter, verseStart: start, verseEnd: vs[i - 1], color: g.color, at: g.at });
        start = vs[i];
      }
    }
  }
  runs.sort((a, b) => b.at - a.at);
  const shown = runs.filter((r) => isHighlightColor(r.color)).slice(0, limit);
  if (shown.length === 0) return [];

  const [texts, kept] = await Promise.all([
    db
      .select({ bookNumber: bibleVerses.bookNumber, chapter: bibleVerses.chapter, verse: bibleVerses.verse, verseEnd: bibleVerses.verseEnd, text: bibleVerses.text })
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.translation, translation),
          sql`(${bibleVerses.bookNumber}, ${bibleVerses.chapter}) in (${sql.join(
            shown.map((r) => sql`(${r.bookNumber}, ${r.chapter})`),
            sql`, `,
          )})`,
        ),
      ),
    db
      .select({ bookNumber: verses.bookNumber, chapter: verses.chapter, verseStart: verses.verseStart, verseEnd: verses.verseEnd })
      .from(verses)
      .where(
        and(
          eq(verses.userId, userId),
          sql`${verses.archivedAt} is null`,
          inArray(verses.bookNumber, [...new Set(shown.map((r) => r.bookNumber))]),
        ),
      ),
  ]);

  return shown.map((r) => ({
    bookNumber: r.bookNumber,
    chapter: r.chapter,
    verseStart: r.verseStart,
    verseEnd: r.verseEnd,
    color: r.color as HighlightColor,
    reference: formatReference(BOOKS[r.bookNumber - 1].name, r.chapter, r.verseStart, r.verseEnd),
    text: texts
      .filter((t) => t.bookNumber === r.bookNumber && t.chapter === r.chapter && t.verse <= r.verseEnd && t.verseEnd >= r.verseStart)
      .sort((a, b) => a.verse - b.verse)
      .map((t) => t.text)
      .join(" "),
    kept: kept.some(
      (k) => k.bookNumber === r.bookNumber && k.chapter === r.chapter && k.verseStart <= r.verseStart && (k.verseEnd ?? k.verseStart) >= r.verseEnd,
    ),
  }));
}

