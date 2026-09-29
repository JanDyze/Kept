// Whether a game is over, and how it ended. Shared by the server (which records the result) and
// the browser (which judges practice replays itself, recording nothing).
import { blankOrder, type FillBlanksPuzzle, type FillBlanksState } from "@/lib/games/fill-blanks";
import type { FirstLettersPuzzle, FirstLettersState } from "@/lib/games/first-letters";
import { matchUpOutcome, type MatchUpPuzzle, type MatchUpState } from "@/lib/games/match-up";
import { missingWordOutcome, type MissingWordPuzzle, type MissingWordState } from "@/lib/games/missing-word";
import { referenceOutcome, type ReferenceWordlePuzzle, type ReferenceWordleState } from "@/lib/games/reference-wordle";
import { reciteOutcome, type RecitePuzzle, type ReciteState } from "@/lib/games/recite";
import type { GameId } from "@/lib/games/registry";
import { spotOutcome, type SpotChangePuzzle, type SpotChangeState } from "@/lib/games/spot-change";
import { twoTonguesOutcome, type TwoTonguesPuzzle, type TwoTonguesState } from "@/lib/games/two-tongues";
import type { UnscramblePuzzle, UnscrambleState } from "@/lib/games/unscramble";

export type Outcome = "won" | "lost";

/** "won" or "lost" once the game has ended, null while it's still being played. */
export function gameOutcome(game: GameId, puzzle: unknown, state: unknown): Outcome | null {
  const done = (outcome: Outcome | "playing") => (outcome === "playing" ? null : outcome);
  const ended = (gaveUp: boolean | undefined, complete: boolean) => (gaveUp ? "lost" : complete ? "won" : null);
  switch (game) {
    case "missing_word":
      return done(missingWordOutcome(puzzle as MissingWordPuzzle, state as MissingWordState));
    case "reference_wordle":
      return done(referenceOutcome(puzzle as ReferenceWordlePuzzle, state as ReferenceWordleState));
    case "spot_change":
      return done(spotOutcome(puzzle as SpotChangePuzzle, state as SpotChangeState));
    case "match_up":
      return done(matchUpOutcome(puzzle as MatchUpPuzzle, state as MatchUpState));
    case "two_tongues":
      return done(twoTonguesOutcome(puzzle as TwoTonguesPuzzle, state as TwoTonguesState));
    case "type_it":
    case "say_it":
      return done(reciteOutcome(game, puzzle as RecitePuzzle, state as ReciteState));
    case "fill_blanks": {
      const s = state as FillBlanksState;
      return ended(s.gaveUp, s.filled >= blankOrder(puzzle as FillBlanksPuzzle).length);
    }
    case "unscramble": {
      const s = state as UnscrambleState;
      return ended(s.gaveUp, s.used.length >= (puzzle as UnscramblePuzzle).chunks.length);
    }
    case "first_letters": {
      const s = state as FirstLettersState;
      return ended(s.gaveUp, s.typed >= (puzzle as FirstLettersPuzzle).tokens.length);
    }
  }
}
