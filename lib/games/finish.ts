import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { dailyGames, reviews, verses, type DailyGame } from "@/lib/db/schema";
import { blankOrder, type FillBlanksPuzzle } from "@/lib/games/fill-blanks";
import { missingWordOutcome, type MissingWordPuzzle, type MissingWordState } from "@/lib/games/missing-word";
import { referenceOutcome, type ReferenceWordlePuzzle } from "@/lib/games/reference-wordle";
import type { FirstLettersPuzzle, FirstLettersState } from "@/lib/games/first-letters";
import { matchUpOutcome, type MatchUpPuzzle, type MatchUpState } from "@/lib/games/match-up";
import { spotOutcome, type SpotChangePuzzle, type SpotChangeState } from "@/lib/games/spot-change";
import { twoTonguesOutcome, type TwoTonguesPuzzle, type TwoTonguesState } from "@/lib/games/two-tongues";
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
  switch (game.game) {
    case "missing_word": {
      const outcome = missingWordOutcome(game.puzzle as MissingWordPuzzle, state as MissingWordState);
      return outcome === "playing" ? null : { status: outcome, ratings: [] };
    }
    case "reference_wordle": {
      const outcome = referenceOutcome(game.puzzle as ReferenceWordlePuzzle, state as never);
      return outcome === "playing" ? null : { status: outcome, ratings: [] };
    }
    case "fill_blanks": {
      const puzzle = game.puzzle as FillBlanksPuzzle;
      const s = state as { filled: number; mistakes: number[]; gaveUp?: boolean };
      const order = blankOrder(puzzle);
      if (!s.gaveUp && s.filled < order.length) return null;
      return {
        status: s.gaveUp ? "lost" : "won",
        ratings: puzzle.verses.map((v, i) => {
          // A verse finished before giving up is still rated on its mistakes.
          const lastBlank = order.findLastIndex((b) => b.verseIndex === i);
          const unfinished = Boolean(s.gaveUp) && s.filled <= lastBlank;
          return { verseId: v.verseId, rating: ratingFromMistakes(s.mistakes[i] ?? 0, unfinished) };
        }),
      };
    }
    case "unscramble": {
      const puzzle = game.puzzle as UnscramblePuzzle;
      const s = state as { used: number[]; mistakes: number; gaveUp?: boolean };
      if (!s.gaveUp && s.used.length < puzzle.chunks.length) return null;
      return {
        status: s.gaveUp ? "lost" : "won",
        ratings: [{ verseId: puzzle.verseId, rating: ratingFromMistakes(s.mistakes, Boolean(s.gaveUp)) }],
      };
    }
    case "first_letters": {
      const puzzle = game.puzzle as FirstLettersPuzzle;
      const s = state as FirstLettersState;
      if (!s.gaveUp && s.typed < puzzle.tokens.length) return null;
      return {
        status: s.gaveUp ? "lost" : "won",
        ratings: [{ verseId: puzzle.verseId, rating: ratingFromMistakes(s.mistakes, Boolean(s.gaveUp)) }],
      };
    }
    case "spot_change": {
      const outcome = spotOutcome(game.puzzle as SpotChangePuzzle, state as SpotChangeState);
      return outcome === "playing" ? null : { status: outcome, ratings: [] };
    }
    case "match_up": {
      const outcome = matchUpOutcome(game.puzzle as MatchUpPuzzle, state as MatchUpState);
      return outcome === "playing" ? null : { status: outcome, ratings: [] };
    }
    case "two_tongues": {
      const outcome = twoTonguesOutcome(game.puzzle as TwoTonguesPuzzle, state as TwoTonguesState);
      return outcome === "playing" ? null : { status: outcome, ratings: [] };
    }
  }
}

const MODE = { fill_blanks: "fill_blank", unscramble: "unscramble", first_letters: "first_letter" } as const;

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
