import "server-only";
import { sql } from "drizzle-orm";
import { BOOKS, formatReference } from "@/lib/bible/books";
import type { LookupTranslation } from "@/lib/bible/translations";
import { db } from "@/lib/db";
import { bibleVerses, topicVerses, verses } from "@/lib/db/schema";
import { verseLikeInfo } from "@/lib/social/likes";
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

export type PopularVerse = SearchHit & { keptBy: number; likes: number; liked: boolean; tags: string[] };

// A tag only shows in Discover once this many people use it, so a personal tag ("mom's surgery")
// never leaves its owner's verses.
const MIN_TAG_PEOPLE = 2;
const COMMUNITY_CANDIDATES = 60;

const key = (c: { bookNumber: number; chapter: number; verseStart: number }) => `${c.bookNumber}:${c.chapter}:${c.verseStart}`;

// Text for passages outside the cached OpenBible list (verses people keep that it doesn't have).
async function textsFor(translation: LookupTranslation, places: Candidate[]) {
  if (places.length === 0) return new Map<string, string>();
  const keys = sql.join(
    places.map((c) => sql`(${c.bookNumber}::int, ${c.chapter}::int, ${c.verseStart}::int, ${c.verseEnd ?? c.verseStart}::int)`),
    sql`, `,
  );
  const rows = await db.execute<{ book_number: number; chapter: number; verse_start: number; text: string | null }>(sql`
    with c(book_number, chapter, verse_start, verse_end) as (values ${keys})
    select c.book_number, c.chapter, c.verse_start,
      (select string_agg(b.text, ' ' order by b.verse) from ${bibleVerses} b
        where b.translation = ${translation} and b.book_number = c.book_number and b.chapter = c.chapter
          and b.verse <= c.verse_end and b.verse_end >= c.verse_start) as text
    from c`);
  return new Map(rows.flatMap((r) => (r.text ? [[`${r.book_number}:${r.chapter}:${r.verse_start}`, r.text] as const] : [])));
}

// The tags people give passages, counted by people, for the ones shown.
async function tagsFor(places: Candidate[]) {
  if (places.length === 0) return new Map<string, string[]>();
  const keys = sql.join(
    places.map((c) => sql`(${c.bookNumber}::int, ${c.chapter}::int, ${c.verseStart}::int)`),
    sql`, `,
  );
  const rows = await db.execute<{ book_number: number; chapter: number; verse_start: number; tag: string; people: number }>(sql`
    with shared as (
      select tag from ${verses}, unnest(tags) as tag
      where archived_at is null group by tag having count(distinct user_id) >= ${MIN_TAG_PEOPLE}
    )
    select v.book_number, v.chapter, v.verse_start, t.tag, count(distinct v.user_id)::int as people
    from ${verses} v, unnest(v.tags) as t(tag)
    where v.archived_at is null and (v.book_number, v.chapter, v.verse_start) in (${keys})
      and t.tag in (select tag from shared)
    group by 1, 2, 3, 4
    order by people desc, t.tag`);
  const out = new Map<string, string[]>();
  for (const r of rows) {
    const k = `${r.book_number}:${r.chapter}:${r.verse_start}`;
    const list = out.get(k) ?? [];
    if (list.length < 3) list.push(r.tag);
    out.set(k, list);
  }
  return out;
}

// Popular verses for Discover: kept by the most *other* Kept users (every save counts, shared or
// not, since only a number shows) plus their likes, then OpenBible's most loved. `tag` narrows it
// to passages people gave that tag.
export async function popularVerses(
  translation: LookupTranslation,
  userId: string,
  opts: { limit?: number; tag?: string } = {},
): Promise<PopularVerse[]> {
  const limit = opts.limit ?? 15;
  if (opts.tag && !(await tagIsShared(opts.tag))) return [];
  const loved = opts.tag ? [] : await mostLoved();

  // Passages other people keep (or anyone tagged `tag`), most people first.
  const community = await db.execute<{ book_number: number; chapter: number; verse_start: number; verse_end: number | null }>(sql`
    select book_number, chapter, verse_start, mode() within group (order by verse_end) as verse_end
    from ${verses}
    where archived_at is null ${opts.tag ? sql`and ${opts.tag} = any(tags)` : sql`and user_id <> ${userId}`}
    group by 1, 2, 3
    order by count(distinct user_id) desc
    limit ${COMMUNITY_CANDIDATES}`);

  const candidates = new Map<string, Candidate & { rank: number }>();
  loved.forEach((c, rank) => candidates.set(key(c), { ...c, rank }));
  for (const r of community) {
    const c = { bookNumber: r.book_number, chapter: r.chapter, verseStart: r.verse_start, verseEnd: r.verse_end, score: 0 };
    if (!candidates.has(key(c))) candidates.set(key(c), { ...c, rank: Number.MAX_SAFE_INTEGER });
  }
  const all = [...candidates.values()];
  if (all.length === 0) return [];

  const keys = sql.join(
    all.map((c) => sql`(${c.bookNumber}::int, ${c.chapter}::int, ${c.verseStart}::int)`),
    sql`, `,
  );
  const [lovedText, likes, counts] = await Promise.all([
    loved.length ? candidateTexts(translation, loved) : new Map<string, string>(),
    verseLikeInfo(userId, all),
    // Kept-by for the OpenBible ones too (the community list above only has the top few).
    db.execute<{ book_number: number; chapter: number; verse_start: number; kept_by: number; saved: boolean }>(sql`
      select book_number, chapter, verse_start,
        count(distinct user_id) filter (where user_id <> ${userId})::int as kept_by,
        bool_or(user_id = ${userId} and translation = ${translation}) as saved
      from ${verses}
      where archived_at is null and (book_number, chapter, verse_start) in (${keys})
      group by 1, 2, 3`),
  ]);
  const kept = new Map(counts.map((r) => [`${r.book_number}:${r.chapter}:${r.verse_start}`, r]));
  const score = (c: Candidate) => (kept.get(key(c))?.kept_by ?? 0) + (likes.get(key(c))?.count ?? 0);

  const ranked = all
    .sort((a, b) => score(b) - score(a) || a.rank - b.rank)
    .slice(0, limit + 10); // a few spare, in case a passage has no text in this translation
  const missing = ranked.filter((c) => !lovedText.has(key(c)));
  const [moreText, tags] = await Promise.all([textsFor(translation, missing), tagsFor(ranked)]);
  const text = (c: Candidate) => lovedText.get(key(c)) ?? moreText.get(key(c));

  return ranked
    .filter((c) => text(c))
    .slice(0, limit)
    .map((c) => ({
      bookNumber: c.bookNumber,
      chapter: c.chapter,
      verseStart: c.verseStart,
      verseEnd: c.verseEnd,
      reference: formatReference(BOOKS[c.bookNumber - 1].name, c.chapter, c.verseStart, c.verseEnd),
      text: text(c)!,
      topics: [],
      saved: Boolean(kept.get(key(c))?.saved),
      keptBy: kept.get(key(c))?.kept_by ?? 0,
      likes: likes.get(key(c))?.count ?? 0,
      liked: likes.get(key(c))?.liked ?? false,
      tags: tags.get(key(c)) ?? [],
    }));
}

async function tagIsShared(tag: string) {
  const [row] = await db.execute<{ people: number }>(sql`
    select count(distinct user_id)::int as people from ${verses} where archived_at is null and ${tag} = any(tags)`);
  return (row?.people ?? 0) >= MIN_TAG_PEOPLE;
}

// The tags most people use, for Discover's row of chips.
export async function popularTags(limit = 12): Promise<string[]> {
  const rows = await db.execute<{ tag: string }>(sql`
    select tag from ${verses}, unnest(tags) as tag
    where archived_at is null
    group by tag
    having count(distinct user_id) >= ${MIN_TAG_PEOPLE}
    order by count(distinct user_id) desc, count(*) desc, tag
    limit ${limit}`);
  return rows.map((r) => r.tag);
}
