import type { DailyGame } from "@/lib/db/schema";
import { MISSING_WORD_GUESSES } from "./missing-word";
import { REFERENCE_GUESSES } from "./reference-wordle";
import { SPOT_LIVES } from "./spot-change";
import type { TwoTonguesPuzzle } from "./two-tongues";

function mistakesOf(state: Record<string, unknown>) {
  const m = state.mistakes ?? state.misses;
  return Array.isArray(m) ? (m as number[]).reduce((a, b) => a + b, 0) : Number(m ?? 0);
}

// How a finished game went, as data the result marks draw (components/games/result-mark.tsx).
export type GameScore =
  | { kind: "perfect" }
  | { kind: "mistakes"; count: number } // won, with some wrong taps
  | { kind: "tries"; used: number; max: number; won: boolean } // guessing games
  | { kind: "score"; right: boolean[] } // one per round
  | { kind: "lives"; left: number; max: number; won: boolean }
  | { kind: "gave_up" };

type Finished = Pick<DailyGame, "game" | "status" | "state" | "puzzle">;

export function gameScore(game: Finished): GameScore | null {
  const state = game.state as Record<string, unknown>;
  if (game.status === "in_progress") return null;
  if (state.gaveUp) return { kind: "gave_up" };
  const won = game.status === "won";

  if (game.game === "missing_word" || game.game === "reference_wordle") {
    const max = game.game === "missing_word" ? MISSING_WORD_GUESSES : REFERENCE_GUESSES;
    return { kind: "tries", used: (state.guesses as unknown[] | undefined)?.length ?? 0, max, won };
  }

  if (game.game === "two_tongues") {
    const rounds = (game.puzzle as TwoTonguesPuzzle).rounds;
    const answers = (state.answers as number[] | undefined) ?? [];
    return { kind: "score", right: rounds.map((r, i) => answers[i] === r.answer) };
  }

  const mistakes = mistakesOf(state);
  if (game.game === "spot_change" && !(won && mistakes === 0))
    return { kind: "lives", left: Math.max(0, SPOT_LIVES - mistakes), max: SPOT_LIVES, won };
  return mistakes === 0 ? { kind: "perfect" } : { kind: "mistakes", count: mistakes };
}

// The same in words: "Perfect", "2 mistakes", "3/6", "2/3", "Out of lives", "Gave up".
export function scoreText(score: GameScore) {
  switch (score.kind) {
    case "perfect":
      return "Perfect";
    case "mistakes":
      return `${score.count} ${score.count === 1 ? "mistake" : "mistakes"}`;
    case "tries":
      return `${score.won ? score.used : "X"}/${score.max}`;
    case "score":
      return `${score.right.filter(Boolean).length}/${score.right.length}`;
    case "lives": {
      const misses = score.max - score.left;
      return score.won ? `${misses} ${misses === 1 ? "miss" : "misses"}` : "Out of lives";
    }
    case "gave_up":
      return "Gave up";
  }
}

export function resultLabel(game: Finished) {
  const score = gameScore(game);
  return score && scoreText(score);
}

export function hasStarted(game: Pick<DailyGame, "state">) {
  const s = game.state as Record<string, unknown>;
  const nonEmpty = (v: unknown) => Array.isArray(v) && v.length > 0;
  return Boolean(
    nonEmpty(s.guesses) ||
      nonEmpty(s.used) ||
      nonEmpty(s.found) ||
      nonEmpty(s.matched) ||
      nonEmpty(s.answers) ||
      (typeof s.filled === "number" && s.filled > 0) ||
      (typeof s.typed === "number" && s.typed > 0) ||
      mistakesOf(s) > 0,
  );
}
