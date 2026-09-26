import { shuffle, type Rng } from "./random";

export const MAX_ROUNDS = 3;

export type TwoTonguesRound = {
  verseId: string;
  reference: string;
  from: string; // translation shown, e.g. "ESV"
  to: string; // translation to pick, e.g. "MBBTAG"
  text: string;
  options: string[]; // the right translation plus decoys, shuffled
  answer: number; // index into options
};

export type TwoTonguesPuzzle = { rounds: TwoTonguesRound[] };

// answers: the option index chosen for each round, in order.
export type TwoTonguesState = { answers: number[]; gaveUp?: boolean };

// Each round: a verse in one translation, its other-translation text, and decoy texts in the
// same translation (from the other rounds' verses or neighboring verses).
export function buildTwoTongues(
  rounds: { verseId: string; reference: string; from: string; to: string; text: string; match: string; decoys: string[] }[],
  rng: Rng,
): TwoTonguesPuzzle | null {
  const usable = rounds.filter((r) => r.decoys.length >= 2).slice(0, MAX_ROUNDS);
  if (usable.length === 0) return null;
  return {
    rounds: usable.map((r) => {
      const options = shuffle([r.match, ...r.decoys.slice(0, 2)], rng);
      return { verseId: r.verseId, reference: r.reference, from: r.from, to: r.to, text: r.text, options, answer: options.indexOf(r.match) };
    }),
  };
}

export function correctCount(puzzle: TwoTonguesPuzzle, state: TwoTonguesState) {
  return state.answers.filter((a, i) => puzzle.rounds[i]?.answer === a).length;
}

// Won with at least half the rounds right.
export function twoTonguesOutcome(puzzle: TwoTonguesPuzzle, state: TwoTonguesState) {
  if (state.gaveUp) return "lost" as const;
  if (state.answers.length < puzzle.rounds.length) return "playing" as const;
  return correctCount(puzzle, state) * 2 >= puzzle.rounds.length ? ("won" as const) : ("lost" as const);
}
