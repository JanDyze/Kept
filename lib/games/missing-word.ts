import { pick, type Rng } from "./random";
import { isPlainWord, isStopword, normalizeWord, tokenize, type Token } from "./words";

export const MISSING_WORD_GUESSES = 6;
const MIN = 4;
const MAX = 8;

export type MissingWordPuzzle = {
  verseId: string;
  reference: string;
  translation: string;
  tokens: Token[];
  answer: string; // normalized (lowercase, no accents)
  hidden: number[]; // token indexes shown as tiles (every occurrence of the answer)
};

export type MissingWordState = { guesses: string[]; gaveUp?: boolean };

export type TileColor = "correct" | "present" | "absent";

// Picks a distinctive 4–8 letter word, favoring names and longer words. Null if the verse has none.
export function buildMissingWord(
  verse: { id: string; reference: string; translation: string; text: string },
  rng: Rng,
): MissingWordPuzzle | null {
  const tokens = tokenize(verse.text);
  const candidates = tokens
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => isPlainWord(t.word) && t.word.length >= MIN && t.word.length <= MAX && !isStopword(t.word));
  if (candidates.length === 0) return null;

  const weighted = candidates.flatMap(({ t, i }) => {
    const sentenceStart = i === 0 || /[.!?]["”’)]*\s*$/.test(tokens[i - 1].post);
    const isName = /^\p{Lu}/u.test(t.word) && !sentenceStart;
    const weight = t.word.length - MIN + 1 + (isName ? 3 : 0);
    return Array.from({ length: weight }, () => i);
  });
  const chosen = tokens[pick(weighted, rng)];
  const answer = normalizeWord(chosen.word);
  const hidden = tokens.flatMap((t, i) => (normalizeWord(t.word) === answer ? [i] : []));

  return { verseId: verse.id, reference: verse.reference, translation: verse.translation, tokens, answer, hidden };
}

// Wordle coloring, handling repeated letters: greens first, then yellows up to the remaining count.
export function scoreGuess(guess: string, answer: string): TileColor[] {
  const g = [...normalizeWord(guess)];
  const a = [...answer];
  const colors: TileColor[] = g.map(() => "absent");
  const remaining = new Map<string, number>();
  g.forEach((ch, i) => {
    if (ch === a[i]) colors[i] = "correct";
    else remaining.set(a[i], (remaining.get(a[i]) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (colors[i] === "correct") return;
    const left = remaining.get(ch) ?? 0;
    if (left > 0) {
      colors[i] = "present";
      remaining.set(ch, left - 1);
    }
  });
  return colors;
}

export function missingWordOutcome(puzzle: Pick<MissingWordPuzzle, "answer">, state: MissingWordState) {
  if (state.guesses.some((g) => normalizeWord(g) === puzzle.answer)) return "won" as const;
  if (state.gaveUp || state.guesses.length >= MISSING_WORD_GUESSES) return "lost" as const;
  return "playing" as const;
}
