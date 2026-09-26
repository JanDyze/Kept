import "server-only";
import { and, desc, eq, gte, isNull, ne, sql } from "drizzle-orm";
import { addDays } from "@/lib/day";
import { db } from "@/lib/db";
import { dailyGames, reviews, verses } from "@/lib/db/schema";
import { GAME_IDS, type GameId } from "@/lib/games/registry";

const CALENDAR_DAYS = 84; // 12 weeks

export type GameStats = { played: number; won: number; avgGuesses: number | null; perfect: number };

// Everything the Progress page shows, computed from daily_games, reviews and verses.
export async function progressStats(userId: string, today: string) {
  const since = addDays(today, -400);
  const [finished, missed, verseRows] = await Promise.all([
    db
      .select({ day: dailyGames.day, game: dailyGames.game, status: dailyGames.status, state: dailyGames.state })
      .from(dailyGames)
      .where(and(eq(dailyGames.userId, userId), ne(dailyGames.status, "in_progress"), gte(dailyGames.day, since))),
    db
      .select({
        verseId: reviews.verseId,
        reference: verses.reference,
        translation: verses.translation,
        misses: sql<number>`count(*) filter (where ${reviews.rating} in ('again', 'hard'))::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .innerJoin(verses, eq(verses.id, reviews.verseId))
      .where(and(eq(reviews.userId, userId), isNull(verses.archivedAt)))
      .groupBy(reviews.verseId, verses.reference, verses.translation)
      .having(sql`count(*) filter (where ${reviews.rating} in ('again', 'hard')) > 0`)
      .orderBy(desc(sql`count(*) filter (where ${reviews.rating} in ('again', 'hard'))`))
      .limit(5),
    db
      .select({
        id: verses.id,
        reference: verses.reference,
        translation: verses.translation,
        srs: verses.srs,
      })
      .from(verses)
      .where(and(eq(verses.userId, userId), isNull(verses.archivedAt))),
  ]);

  // Games finished per day → streaks and the calendar.
  const perDay = new Map<string, number>();
  for (const g of finished) perDay.set(g.day, (perDay.get(g.day) ?? 0) + 1);
  const played = new Set(perDay.keys());

  let current = 0;
  for (let d = played.has(today) ? today : addDays(today, -1); played.has(d); d = addDays(d, -1)) current++;

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of [...played].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  // Calendar ends on the Saturday of this week, so columns are whole weeks.
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const end = addDays(today, 6 - weekday);
  const calendar = Array.from({ length: CALENDAR_DAYS }, (_, i) => {
    const day = addDays(end, i - CALENDAR_DAYS + 1);
    return { day, games: perDay.get(day) ?? 0, future: day > today };
  });

  const byGame = {} as Record<GameId, GameStats>;
  for (const id of GAME_IDS) {
    const rows = finished.filter((g) => g.game === id);
    const wins = rows.filter((g) => g.status === "won");
    const guesses = wins.map((g) => ((g.state as { guesses?: unknown[] }).guesses ?? []).length).filter(Boolean);
    const perfect = wins.filter((g) => {
      const st = g.state as { mistakes?: number | number[]; misses?: number };
      const m = st.mistakes ?? st.misses;
      return (Array.isArray(m) ? m.reduce((a, b) => a + b, 0) : (m ?? 0)) === 0;
    }).length;
    byGame[id] = {
      played: rows.length,
      won: wins.length,
      avgGuesses: guesses.length ? guesses.reduce((a, b) => a + b, 0) / guesses.length : null,
      perfect,
    };
  }

  const practiced = verseRows.filter((v) => v.srs !== null);
  const strongest = practiced
    .map((v) => ({ ...v, stability: Number((v.srs as { stability?: number }).stability ?? 0) }))
    .sort((a, b) => b.stability - a.stability)
    .slice(0, 3);

  return {
    streak: { current, best },
    gamesPlayed: finished.length,
    daysPlayed: played.size,
    calendar,
    byGame,
    verses: {
      total: verseRows.length,
      practiced: practiced.length,
      notPracticed: verseRows.length - practiced.length,
    },
    missed,
    strongest,
  };
}
