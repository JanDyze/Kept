import { shuffle, type Rng } from "./random";

export const MAX_PAIRS = 4;
const SNIPPET_WORDS = 14;

export type MatchUpPuzzle = {
  pairs: { verseId: string; reference: string; translation: string; snippet: string }[];
  textOrder: number[]; // pair indexes in the order the texts are shown
};

// matched: pair indexes already paired; mistakes: wrong pairings.
export type MatchUpState = { matched: number[]; mistakes: number; gaveUp?: boolean };

export function snippet(text: string) {
  const words = text.trim().split(/\s+/);
  return words.length > SNIPPET_WORDS ? `${words.slice(0, SNIPPET_WORDS).join(" ")}…` : text.trim();
}

// Needs at least two verses with different references (so every pair is unambiguous).
export function buildMatchUp(
  verses: { id: string; reference: string; translation: string; text: string }[],
  rng: Rng,
): MatchUpPuzzle | null {
  const seen = new Set<string>();
  const picked = verses.filter((v) => !seen.has(v.reference) && seen.add(v.reference)).slice(0, MAX_PAIRS);
  if (picked.length < 2) return null;
  const pairs = picked.map((v) => ({ verseId: v.id, reference: v.reference, translation: v.translation, snippet: snippet(v.text) }));
  let textOrder = shuffle(pairs.map((_, i) => i), rng);
  for (let tries = 0; tries < 5 && textOrder.every((p, i) => p === i); tries++) textOrder = shuffle(pairs.map((_, i) => i), rng);
  return { pairs, textOrder };
}

export function matchUpOutcome(puzzle: Pick<MatchUpPuzzle, "pairs">, state: MatchUpState) {
  if (state.gaveUp) return "lost" as const;
  return state.matched.length === puzzle.pairs.length ? ("won" as const) : ("playing" as const);
}
