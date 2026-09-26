import type { DailyGame } from "@/lib/db/schema";
import { MISSING_WORD_GUESSES } from "./missing-word";
import { REFERENCE_GUESSES } from "./reference-wordle";
import type { TwoTonguesPuzzle } from "./two-tongues";

function mistakesOf(state: Record<string, unknown>) {
  const m = state.mistakes ?? state.misses;
  return Array.isArray(m) ? (m as number[]).reduce((a, b) => a + b, 0) : Number(m ?? 0);
}

// Short result for a finished game: "3/6", "Perfect", "2 mistakes", "Gave up".
export function resultLabel(game: Pick<DailyGame, "game" | "status" | "state" | "puzzle">) {
  const state = game.state as Record<string, unknown>;
  if (game.status === "in_progress") return null;
  if (state.gaveUp) return "Gave up";

  if (game.game === "missing_word" || game.game === "reference_wordle") {
    const max = game.game === "missing_word" ? MISSING_WORD_GUESSES : REFERENCE_GUESSES;
    const tries = (state.guesses as unknown[] | undefined)?.length ?? 0;
    return game.status === "won" ? `${tries}/${max}` : `X/${max}`;
  }

  if (game.game === "two_tongues") {
    const rounds = (game.puzzle as TwoTonguesPuzzle).rounds;
    const answers = (state.answers as number[] | undefined) ?? [];
    return `${answers.filter((a, i) => rounds[i]?.answer === a).length}/${rounds.length}`;
  }

  if (game.game === "spot_change" && game.status === "lost") return "Out of lives";

  const mistakes = mistakesOf(state);
  const [one, many] = game.game === "spot_change" ? ["miss", "misses"] : ["mistake", "mistakes"];
  return mistakes === 0 ? "Perfect" : `${mistakes} ${mistakes === 1 ? one : many}`;
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
