import "server-only";
import { and, asc, desc, eq, gte, isNull, ne, notBetween, sql } from "drizzle-orm";
import { bookByNumber } from "@/lib/bible/books";
import { getPassage } from "@/lib/bible/lookup";
import { isLookupTranslation } from "@/lib/bible/translations";
import { commonWords, properNames } from "@/lib/bible/vocab";
import { addDays } from "@/lib/day";
import { db } from "@/lib/db";
import { bibleVerses, dailyGames, verses, type DailyGame, type Verse } from "@/lib/db/schema";
import { buildFillBlanks } from "./fill-blanks";
import { buildFirstLetters } from "./first-letters";
import { buildMatchUp } from "./match-up";
import { buildMissingWord } from "./missing-word";
import { seededRandom, shuffle } from "./random";
import type { ReferenceWordlePuzzle } from "./reference-wordle";
import { GAMES, type GameId } from "./registry";
import { buildSpotChange } from "./spot-change";
import { buildTwoTongues } from "./two-tongues";
import { buildUnscramble } from "./unscramble";
import { tokenize } from "./words";

const MAX_RECALL_VERSES = 3;

function inShelfOrder(rows: DailyGame[]) {
  return GAMES.flatMap((g) => rows.filter((r) => r.game === g.id));
}

export async function getDay(userId: string, day: string) {
  const rows = await db
    .select()
    .from(dailyGames)
    .where(and(eq(dailyGames.userId, userId), eq(dailyGames.day, day)));
  return inShelfOrder(rows);
}

// Days already topped up on this server instance, so games that can't be built from the current
// verses (e.g. Match Up with one verse) don't trigger a rebuild on every page load.
const toppedUp = new Set<string>();

// Returns the day's games, building and saving them the first time the day is opened. A day
// started before new games were added gets just the missing ones.
export async function getOrCreateDay(userId: string, day: string) {
  const existing = await getDay(userId, day);
  if (existing.length === GAMES.length) return existing;
  if (existing.length > 0 && toppedUp.has(`${userId}|${day}`)) return existing;
  toppedUp.add(`${userId}|${day}`);

  const pool = await db
    .select()
    .from(verses)
    .where(and(eq(verses.userId, userId), isNull(verses.archivedAt)));
  if (pool.length === 0) return [];

  const have = new Set(existing.map((g) => g.game));
  const rows = (await buildDay(userId, day, pool)).filter((r) => !have.has(r.game));
  // One statement, so a day is created whole; a second device racing us just loses.
  if (rows.length > 0) await db.insert(dailyGames).values(rows).onConflictDoNothing();
  return getDay(userId, day);
}

async function lastUsedByVerse(userId: string, day: string) {
  const rows = await db.execute<{ id: string; last: string }>(sql`
    select unnest(${dailyGames.verseIds}) as id, max(${dailyGames.day})::text as last
    from ${dailyGames}
    where ${dailyGames.userId} = ${userId} and ${dailyGames.day} >= ${addDays(day, -60)}
    group by 1`);
  return new Map(rows.map((r) => [r.id, r.last]));
}

async function buildDay(userId: string, day: string, pool: Verse[]) {
  const now = new Date();
  const rng = (game: GameId) => seededRandom(`${userId}|${day}|${game}`);
  const used = new Set<string>();
  const rows: (typeof dailyGames.$inferInsert)[] = [];
  const add = (game: GameId, picked: Verse[], puzzle: unknown) => {
    picked.forEach((v) => used.add(v.id));
    rows.push({ userId, day, game, verseIds: picked.map((v) => v.id), puzzle });
  };

  // Recall games: verses never practiced first (oldest saved first), then the most overdue.
  const unpracticed = (v: Verse) => v.srs === null;
  const byNeed = [...pool].sort(
    (a, b) =>
      Number(unpracticed(b)) - Number(unpracticed(a)) ||
      (unpracticed(a) ? a.createdAt.getTime() - b.createdAt.getTime() : a.dueAt.getTime() - b.dueAt.getTime()),
  );
  const needing = byNeed.filter((v) => unpracticed(v) || v.dueAt <= now).length;
  // Prefer verses no other game has taken today; fall back to sharing when the pool is small.
  const fresh = (list: Verse[]) => [...list.filter((v) => !used.has(v.id)), ...list.filter((v) => used.has(v.id))];

  const fillVerses = byNeed.slice(0, Math.min(MAX_RECALL_VERSES, Math.max(1, needing)));
  // Decoys: words from your other verses plus common words, so wrong answers look plausible.
  const translation = fillVerses[0].translation;
  // Whole words only, and none with a capital, which may be a name ("Jose").
  const fromOtherVerses = pool
    .filter((v) => v.translation === translation && !fillVerses.includes(v))
    .flatMap((v) => tokenize(v.text).map((t) => t.word))
    .filter((w) => !/^\p{Lu}/u.test(w));
  const decoys = [...fromOtherVerses, ...(await commonWords(translation).catch(() => [] as string[]))];
  const names = await properNames(translation).catch(() => new Set<string>());
  add("fill_blanks", fillVerses, buildFillBlanks(fillVerses.map(asInput), decoys, rng("fill_blanks"), names));

  for (const v of fresh(byNeed)) {
    const puzzle = buildUnscramble(asInput(v), rng("unscramble"));
    if (puzzle) {
      add("unscramble", [v], puzzle);
      break;
    }
  }

  // Fun games: whichever verses they've used least recently.
  const lastUsed = await lastUsedByVerse(userId, day);
  const byStaleness = shuffle(pool, rng("missing_word")).sort((a, b) =>
    (lastUsed.get(a.id) ?? "").localeCompare(lastUsed.get(b.id) ?? ""),
  );

  for (const v of fresh(byStaleness)) {
    const puzzle = buildMissingWord(
      asInput(v),
      rng("missing_word"),
      await properNames(v.translation).catch(() => undefined),
    );
    if (puzzle) {
      add("missing_word", [v], puzzle);
      break;
    }
  }

  const refVerse = fresh(byStaleness)[0];
  const reference: ReferenceWordlePuzzle = {
    verseId: refVerse.id,
    translation: refVerse.translation,
    text: refVerse.text,
    reference: refVerse.reference,
    answer: {
      bookNumber: refVerse.bookNumber,
      chapter: refVerse.chapter,
      verseStart: refVerse.verseStart,
      verseEnd: refVerse.verseEnd,
    },
  };
  add("reference_wordle", [refVerse], reference);

  // First Letters (recall): the most-needed verse the other recall games didn't take.
  for (const v of fresh(byNeed)) {
    const puzzle = buildFirstLetters(asInput(v));
    if (puzzle) {
      add("first_letters", [v], puzzle);
      break;
    }
  }

  for (const v of fresh(byStaleness)) {
    const pool = await commonWords(v.translation).catch(() => [] as string[]);
    const puzzle = buildSpotChange(asInput(v), pool, rng("spot_change"));
    if (puzzle) {
      add("spot_change", [v], puzzle);
      break;
    }
  }

  const matchUp = buildMatchUp(fresh(byStaleness).map(asInput), rng("match_up"));
  if (matchUp) {
    add(
      "match_up",
      matchUp.pairs.map((p) => pool.find((v) => v.id === p.verseId)!),
      matchUp,
    );
  }

  const tongues = await twoTonguesRounds(fresh(byStaleness));
  const twoTongues = buildTwoTongues(tongues, rng("two_tongues"));
  if (twoTongues) {
    add(
      "two_tongues",
      twoTongues.rounds.map((r) => pool.find((v) => v.id === r.verseId)!),
      twoTongues,
    );
  }

  return rows;
}

// Two Tongues: up to three verses with their text in the other translation. Decoys are the other
// rounds' texts, topped up with neighboring verses from the same chapter.
async function twoTonguesRounds(candidates: Verse[]) {
  const seen = new Set<string>();
  const picked = candidates
    .filter((v) => isLookupTranslation(v.translation) && !seen.has(v.reference) && seen.add(v.reference))
    .slice(0, 3);

  const withMatch = await Promise.all(
    picked.map(async (v) => {
      const to = v.translation === "ESV" ? "MBBTAG" : "ESV";
      const ref = { book: bookByNumber(v.bookNumber), chapter: v.chapter, verseStart: v.verseStart, verseEnd: v.verseEnd };
      const passage = await getPassage(to, ref);
      return passage ? { v, to, match: passage.text } : null;
    }),
  );
  const found = withMatch.filter((r) => r !== null);

  return Promise.all(
    found.map(async ({ v, to, match }) => {
      const decoys = found.filter((o) => o.v.id !== v.id && o.to === to && o.match !== match).map((o) => o.match);
      if (decoys.length < 2) {
        const neighbors = await db
          .select({ text: bibleVerses.text })
          .from(bibleVerses)
          .where(
            and(
              eq(bibleVerses.translation, to),
              eq(bibleVerses.bookNumber, v.bookNumber),
              eq(bibleVerses.chapter, v.chapter),
              notBetween(bibleVerses.verse, v.verseStart, v.verseEnd ?? v.verseStart),
            ),
          )
          .orderBy(asc(sql`abs(${bibleVerses.verse} - ${v.verseStart})`))
          .limit(2);
        decoys.push(...neighbors.map((n) => n.text));
      }
      return { verseId: v.id, reference: v.reference, from: v.translation, to, text: v.text, match, decoys };
    }),
  );
}

function asInput(v: Verse) {
  return { id: v.id, reference: v.reference, translation: v.translation, text: v.text };
}

// Consecutive days, ending today (or yesterday if today isn't played yet), with a finished game.
export async function streak(userId: string, day: string) {
  const rows = await db
    .selectDistinct({ day: dailyGames.day })
    .from(dailyGames)
    .where(
      and(
        eq(dailyGames.userId, userId),
        ne(dailyGames.status, "in_progress"),
        gte(dailyGames.day, addDays(day, -400)),
      ),
    )
    .orderBy(desc(dailyGames.day));
  const played = new Set(rows.map((r) => r.day));
  let cursor = played.has(day) ? day : addDays(day, -1);
  let count = 0;
  while (played.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}
