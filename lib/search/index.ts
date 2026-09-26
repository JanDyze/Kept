import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { BOOKS, formatReference } from "@/lib/bible/books";
import type { LookupTranslation } from "@/lib/bible/translations";
import { db } from "@/lib/db";
import { bibleVerses, topicVerses, verses } from "@/lib/db/schema";
import { matchTopics, normalizeQuery, rankVerses, type TopicInfo } from "./topics";

const PER_TOPIC = 80;
const TEXT_LIMIT = 20;

let topicCache: Promise<TopicInfo[]> | null = null;

// All topic names with their total votes, loaded once per server instance.
function topicList() {
  topicCache ??= db
    .select({ topic: topicVerses.topic, votes: sql<number>`sum(${topicVerses.votes})::int` })
    .from(topicVerses)
    .groupBy(topicVerses.topic)
    .catch((e) => {
      topicCache = null;
      throw e;
    });
  return topicCache;
}

export type SearchHit = {
  reference: string;
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  text: string;
  topics: string[];
  saved: boolean;
};

type Place = { bookNumber: number; chapter: number; verseStart: number; verseEnd: number | null };

// Top verses for each matched topic, with their text in the translation, in one round trip
// (the database is far away, so round trips dominate). Passages the translation omits get no text.
async function topicRowsWithText(topics: string[], translation: LookupTranslation) {
  if (topics.length === 0) return [];
  const rows = await db.execute<{
    topic: string;
    book_number: number;
    chapter: number;
    verse_start: number;
    verse_end: number | null;
    votes: number;
    text: string | null;
  }>(sql`
    select tv.topic, tv.book_number, tv.chapter, tv.verse_start, tv.verse_end, tv.votes,
      (select string_agg(bv.text, ' ' order by bv.verse)
         from ${bibleVerses} bv
        where bv.translation = ${translation} and bv.book_number = tv.book_number and bv.chapter = tv.chapter
          and bv.verse <= coalesce(tv.verse_end, tv.verse_start) and bv.verse_end >= tv.verse_start) as text
    from (
      select *, row_number() over (partition by topic order by votes desc) as rn
      from ${topicVerses}
      where topic in (${sql.join(topics.map((t) => sql`${t}`), sql`, `)})
    ) tv
    where tv.rn <= ${PER_TOPIC}`);
  return rows.map((r) => ({
    topic: r.topic,
    bookNumber: r.book_number,
    chapter: r.chapter,
    verseStart: r.verse_start,
    verseEnd: r.verse_end,
    votes: r.votes,
    text: r.text,
  }));
}

// Whole-word match of the exact words typed ("love is patient", "ina" but not "sinabi").
export function wordPattern(query: string) {
  const escaped = query
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return `\\m${escaped}\\M`; // Postgres regex word boundaries
}

async function savedKeys(userId: string, translation: string) {
  const rows = await db
    .select({ b: verses.bookNumber, c: verses.chapter, s: verses.verseStart })
    .from(verses)
    .where(and(eq(verses.userId, userId), eq(verses.translation, translation)));
  return new Set(rows.map((r) => `${r.b}:${r.c}:${r.s}`));
}

export async function searchVerses(query: string, translation: LookupTranslation, userId: string) {
  const q = normalizeQuery(query);
  if (q.length < 2) return { topics: [], hits: [], textHits: [] };

  const matches = matchTopics(q, await topicList());
  const [topicRows, saved, textRows] = await Promise.all([
    topicRowsWithText(
      matches.map((m) => m.topic),
      translation,
    ),
    savedKeys(userId, translation),
    query.trim().length >= 3
      ? db
          .select({
            bookNumber: bibleVerses.bookNumber,
            chapter: bibleVerses.chapter,
            verse: bibleVerses.verse,
            verseEnd: bibleVerses.verseEnd,
            text: bibleVerses.text,
          })
          .from(bibleVerses)
          .where(and(eq(bibleVerses.translation, translation), sql`${bibleVerses.text} ~* ${wordPattern(query)}`))
          .orderBy(bibleVerses.bookNumber, bibleVerses.chapter, bibleVerses.verse)
          .limit(TEXT_LIMIT * 3)
      : Promise.resolve([]),
  ]);

  const textOf = new Map(
    topicRows.map((r) => [`${r.bookNumber}:${r.chapter}:${r.verseStart}-${r.verseEnd ?? r.verseStart}`, r.text]),
  ); // every ranked range comes from some topic row, so its exact text is here
  const hit = (p: Place, text: string, topics: string[]): SearchHit => ({
    ...p,
    reference: formatReference(BOOKS[p.bookNumber - 1].name, p.chapter, p.verseStart, p.verseEnd),
    text,
    topics,
    saved: saved.has(`${p.bookNumber}:${p.chapter}:${p.verseStart}`),
  });
  const hits = rankVerses(matches, topicRows).flatMap((r) => {
    const text = textOf.get(`${r.bookNumber}:${r.chapter}:${r.verseStart}-${r.verseEnd ?? r.verseStart}`);
    return text ? [hit(r, text, r.topics)] : [];
  });

  const shown = new Set(hits.map((h) => `${h.bookNumber}:${h.chapter}:${h.verseStart}`));
  const textHits = textRows
    .filter((r) => !shown.has(`${r.bookNumber}:${r.chapter}:${r.verse}`))
    .slice(0, TEXT_LIMIT)
    .map((r) =>
      hit({ bookNumber: r.bookNumber, chapter: r.chapter, verseStart: r.verse, verseEnd: r.verseEnd > r.verse ? r.verseEnd : null }, r.text, []),
    );

  return { topics: matches.map((m) => m.topic), hits, textHits };
}

// Exact-words search of one translation for the Bible page, in Bible order.
export async function searchBibleText(query: string, translation: LookupTranslation, limit = 50) {
  const where = and(eq(bibleVerses.translation, translation), sql`${bibleVerses.text} ~* ${wordPattern(query)}`);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        bookNumber: bibleVerses.bookNumber,
        chapter: bibleVerses.chapter,
        verse: bibleVerses.verse,
        verseEnd: bibleVerses.verseEnd,
        text: bibleVerses.text,
      })
      .from(bibleVerses)
      .where(where)
      .orderBy(bibleVerses.bookNumber, bibleVerses.chapter, bibleVerses.verse)
      .limit(limit),
    db.select({ total: sql<number>`count(*)::int` }).from(bibleVerses).where(where),
  ]);
  return { rows, total };
}
