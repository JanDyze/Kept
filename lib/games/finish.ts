import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { dailyGames, reviews, verses, type DailyGame } from "@/lib/db/schema";
import { blankOrder, type FillBlanksPuzzle, type FillBlanksState } from "@/lib/games/fill-blanks";
import type { FirstLettersPuzzle } from "@/lib/games/first-letters";
import { gameOutcome } from "@/lib/games/outcome";
import type { RecitePuzzle, ReciteState } from "@/lib/games/recite";
import type { UnscramblePuzzle } from "@/lib/games/unscramble";
import { ratingFromMistakes, schedule, type ReviewRating } from "@/lib/srs";

const count = z.number().int().min(0).max(1000);
const STATE_SCHEMAS = {
  missing_word: z.object({ guesses: z.array(z.string().max(20)).max(6), gaveUp: z.boolean().optional() }),
  reference_wordle: z.object({
    guesses: z.array(z.object({ bookNumber: count, chapter: count, verse: count })).max(6),
    gaveUp: z.boolean().optional(),
  }),
  fill_blanks: z.object({ filled: count, mistakes: z.array(count).max(10), gaveUp: z.boolean().optional() }),
  unscramble: z.object({ used: z.array(count).max(200), mistakes: count, gaveUp: z.boolean().optional() }),
  first_letters: z.object({ typed: count, mistakes: count, gaveUp: z.boolean().optional() }),
  spot_change: z.object({ found: z.array(count).max(10), misses: count, gaveUp: z.boolean().optional() }),
  match_up: z.object({ matched: z.array(count).max(10), mistakes: count, gaveUp: z.boolean().optional() }),
  two_tongues: z.object({ answers: z.array(count).max(10), gaveUp: z.boolean().optional() }),
  type_it: z.object({ attempts: z.array(z.string().max(4000)).max(3), gaveUp: z.boolean().optional() }),
  say_it: z.object({ attempts: z.array(z.string().max(4000)).max(3), gaveUp: z.boolean().optional() }),
} satisfies Record<DailyGame["game"], z.ZodType>;

async function loadGame(userId: string, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [game] = await db
    .select()
    .from(dailyGames)
    .where(and(eq(dailyGames.id, id), eq(dailyGames.userId, userId)))
    .limit(1);
  return game ?? null;
}

// Saves progress so a game can be resumed on any device.
export async function saveProgress(userId: string, id: string, state: unknown) {
  const game = await loadGame(userId, id);
  if (!game || game.status !== "in_progress") return;
  const parsed = STATE_SCHEMAS[game.game].safeParse(state);
  if (!parsed.success) return;
  await db
    .update(dailyGames)
    .set({ state: parsed.data })
    .where(and(eq(dailyGames.id, id), eq(dailyGames.status, "in_progress")));
}

type Finish = { status: "won" | "lost"; ratings: { verseId: string; rating: ReviewRating }[] };

function judge(game: DailyGame, state: unknown): Finish | null {
  const status = gameOutcome(game.game, game.puzzle, state);
  if (!status) return null;
  const gaveUp = Boolean((state as { gaveUp?: boolean }).gaveUp);
  switch (game.game) {
    case "fill_blanks": {
      const puzzle = game.puzzle as FillBlanksPuzzle;
      const s = state as FillBlanksState;
      const order = blankOrder(puzzle);
      return {
        status,
        ratings: puzzle.verses.map((v, i) => {
          // A verse finished before giving up is still rated on its mistakes.
          const lastBlank = order.findLastIndex((b) => b.verseIndex === i);
          const unfinished = gaveUp && s.filled <= lastBlank;
          return { verseId: v.verseId, rating: ratingFromMistakes(s.mistakes[i] ?? 0, unfinished) };
        }),
      };
    }
    case "unscramble":
    case "first_letters": {
      const puzzle = game.puzzle as UnscramblePuzzle | FirstLettersPuzzle;
      const { mistakes } = state as { mistakes: number };
      return { status, ratings: [{ verseId: puzzle.verseId, rating: ratingFromMistakes(mistakes, gaveUp) }] };
    }
    case "type_it":
    case "say_it": {
      // Each extra check counts like a mistake; not getting there at all is "again".
      const puzzle = game.puzzle as RecitePuzzle;
      const tries = (state as ReciteState).attempts.length;
      return { status, ratings: [{ verseId: puzzle.verseId, rating: ratingFromMistakes(Math.max(0, tries - 1), status === "lost") }] };
    }
    default:
      return { status, ratings: [] };
  }
}

const MODE = {
  fill_blanks: "fill_blank",
  unscramble: "unscramble",
  first_letters: "first_letter",
  type_it: "recite",
  say_it: "recite",
} as const;

// Ends a game once. Recall games also rate each verse and move its review schedule.
export async function completeGame(userId: string, id: string, state: unknown) {
  const game = await loadGame(userId, id);
  if (!game) return { ok: false as const };
  if (game.status !== "in_progress") return { ok: true as const, status: game.status };

  const parsed = STATE_SCHEMAS[game.game].safeParse(state);
  if (!parsed.success) return { ok: false as const };
  const result = judge(game, parsed.data);
  if (!result) return { ok: false as const };

  await db.transaction(async (tx) => {
    const finished = await tx
      .update(dailyGames)
      .set({ state: parsed.data, status: result.status, finishedAt: new Date() })
      .where(and(eq(dailyGames.id, id), eq(dailyGames.status, "in_progress")))
      .returning({ id: dailyGames.id });
    // Another tab or device finished it first: don't rate twice.
    if (finished.length === 0 || result.ratings.length === 0) return;

    const mode = MODE[game.game as keyof typeof MODE];
    const ids = result.ratings.map((r) => r.verseId);
    const owned = await tx
      .select()
      .from(verses)
      .where(and(eq(verses.userId, userId), inArray(verses.id, ids)));
    const now = new Date();
    for (const { verseId, rating } of result.ratings) {
      const verse = owned.find((v) => v.id === verseId);
      if (!verse) continue; // deleted since the puzzle was made
      await tx.update(verses).set(schedule(verse, rating, now)).where(eq(verses.id, verseId));
      await tx.insert(reviews).values({ verseId, userId, rating, mode, reviewedAt: now });
    }
  });

  return { ok: true as const, status: result.status };
}
