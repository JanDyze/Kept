import "server-only";
import { sql } from "drizzle-orm";
import { BOOKS, formatReference } from "@/lib/bible/books";
import type { LookupTranslation } from "@/lib/bible/translations";
import { db } from "@/lib/db";
import { bibleVerses, topicVerses, verses } from "@/lib/db/schema";
import type { SearchHit } from "./index";

const CANDIDATES = 80;

type Candidate = { bookNumber: number; chapter: number; verseStart: number; verseEnd: number | null; score: number };

// OpenBible's most-loved passages (fixed data, so computed once per server). Each topic adds the
// verse's share of that topic's top votes, weighted by how many people voted in the topic, so a
// verse loved across many real topics outranks one that tops a single one; tiny topics (a handful
// of votes, often stray searches) are ignored. Ranges starting on the same verse count as one.
// Revelation 1:1 is excluded: OpenBible appears to have shown it as a default result, so it
// collected votes in thousands of unrelated topics ("kung pao", "arbitrage", ...).
const MIN_TOPIC_VOTES = 100;
const MIN_TOPIC_VERSES = 10;
let loved: Promise<Candidate[]> | null = null;
function mostLoved() {
  loved ??= db
    .execute<{ book_number: number; chapter: number; verse_start: number; verse_end: number | null; score: number }>(sql`
      with top as (
        select topic, max(votes)::float as best from ${topicVerses}
        group by topic having max(votes) >= ${MIN_TOPIC_VOTES} and count(*) >= ${MIN_TOPIC_VERSES}
      )
      select tv.book_number, tv.chapter, tv.verse_start, tv.verse_end, sum(tv.votes / top.best * ln(top.best)) as score
      from ${topicVerses} tv join top on top.topic = tv.topic
      where not (tv.book_number = 66 and tv.chapter = 1 and tv.verse_start = 1)
      group by 1, 2, 3, 4
      order by score desc
      limit ${CANDIDATES * 2}`)
    .then((rows) => {
      const byStart = new Map<string, Candidate>();
      for (const r of rows) {
        const key = `${r.book_number}:${r.chapter}:${r.verse_start}`;
        const hit = byStart.get(key);
        if (hit) hit.score += Number(r.score);
        else byStart.set(key, { bookNumber: r.book_number, chapter: r.chapter, verseStart: r.verse_start, verseEnd: r.verse_end, score: Number(r.score) });
      }
      return [...byStart.values()].sort((a, b) => b.score - a.score).slice(0, CANDIDATES);
    })
    .catch((e) => {
      loved = null;
      throw e;
    });
  return loved;
}

// Their text per translation, also fixed, so cached too.
const texts = new Map<string, Promise<Map<string, string>>>();
function candidateTexts(translation: LookupTranslation, candidates: Candidate[]) {
  let cached = texts.get(translation);
  if (!cached) {
    const keys = sql.join(
      candidates.map((c) => sql`(${c.bookNumber}::int, ${c.chapter}::int, ${c.verseStart}::int, ${c.verseEnd ?? c.verseStart}::int)`),
      sql`, `,
    );
    cached = db
      .execute<{ book_number: number; chapter: number; verse_start: number; text: string | null }>(sql`
        with c(book_number, chapter, verse_start, verse_end) as (values ${keys})
        select c.book_number, c.chapter, c.verse_start,
          (select string_agg(b.text, ' ' order by b.verse) from ${bibleVerses} b
            where b.translation = ${translation} and b.book_number = c.book_number and b.chapter = c.chapter
              and b.verse <= c.verse_end and b.verse_end >= c.verse_start) as text
        from c`)
      .then((rows) => new Map(rows.flatMap((r) => (r.text ? [[`${r.book_number}:${r.chapter}:${r.verse_start}`, r.text] as const] : []))));
    cached.catch(() => texts.delete(translation));
    texts.set(translation, cached);
  }
  return cached;
}

export type PopularVerse = SearchHit & { keptBy: number };

// Popular verses for Discover: kept by the most *other* Kept users first (so your own saves don't
// crowd your list), then OpenBible's most loved. Per visit it's one small query; the OpenBible
// ranking and verse texts are cached.
export async function popularVerses(translation: LookupTranslation, userId: string, limit = 15): Promise<PopularVerse[]> {
  const candidates = await mostLoved();
  if (candidates.length === 0) return [];

  const keys = sql.join(
    candidates.map((c) => sql`(${c.bookNumber}::int, ${c.chapter}::int, ${c.verseStart}::int)`),
    sql`, `,
  );
  const [text, rows] = await Promise.all([
    candidateTexts(translation, candidates),
    db.execute<{ book_number: number; chapter: number; verse_start: number; kept_by: number; saved: boolean }>(sql`
      select book_number, chapter, verse_start,
        count(distinct user_id) filter (where user_id <> ${userId})::int as kept_by,
        bool_or(user_id = ${userId} and translation = ${translation}) as saved
      from ${verses}
      where archived_at is null and (book_number, chapter, verse_start) in (${keys})
      group by 1, 2, 3`),
  ]);

  const counts = new Map(rows.map((r) => [`${r.book_number}:${r.chapter}:${r.verse_start}`, r]));
  const key = (c: Candidate) => `${c.bookNumber}:${c.chapter}:${c.verseStart}`;
  return candidates
    .map((c, rank) => ({ c, rank, keptBy: counts.get(key(c))?.kept_by ?? 0 }))
    .filter((x) => text.has(key(x.c)))
    .sort((a, b) => b.keptBy - a.keptBy || a.rank - b.rank)
    .slice(0, limit)
    .map(({ c, keptBy }) => ({
      bookNumber: c.bookNumber,
      chapter: c.chapter,
      verseStart: c.verseStart,
      verseEnd: c.verseEnd,
      reference: formatReference(BOOKS[c.bookNumber - 1].name, c.chapter, c.verseStart, c.verseEnd),
      text: text.get(key(c))!,
      topics: [],
      saved: Boolean(counts.get(key(c))?.saved),
      keptBy,
    }));
}
