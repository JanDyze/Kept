import { shuffle, type Rng } from "./random";
import { isStopword, normalizeWord, tokenize, type Token } from "./words";

const BLANK_SHARE = 0.35;
const MAX_BLANKS_PER_VERSE = 8;
const DECOYS = 3;

export type FillBlanksVerse = {
  verseId: string;
  reference: string;
  translation: string;
  tokens: Token[];
  blanks: number[]; // token indexes, in reading order
};

export type FillBlanksPuzzle = {
  verses: FillBlanksVerse[];
  bank: string[]; // answers plus decoys, shuffled, lowercase
};

// Blanks are filled in reading order across all verses; mistakes are tracked per verse.
export type FillBlanksState = { filled: number; mistakes: number[]; gaveUp?: boolean };

export function buildFillBlanks(
  verses: { id: string; reference: string; translation: string; text: string }[],
  decoyPool: string[],
  rng: Rng,
): FillBlanksPuzzle {
  const built = verses.map((v) => {
    const tokens = tokenize(v.text);
    const candidates = tokens.flatMap((t, i) => (t.word.length >= 3 && !isStopword(t.word) ? [i] : []));
    const count = Math.min(MAX_BLANKS_PER_VERSE, Math.max(1, Math.round(candidates.length * BLANK_SHARE)));
    const blanks = shuffle(candidates.length ? candidates : tokens.map((_, i) => i), rng)
      .slice(0, count)
      .sort((a, b) => a - b);
    return { verseId: v.id, reference: v.reference, translation: v.translation, tokens, blanks };
  });

  const answers = built.flatMap((v) => v.blanks.map((i) => bankWord(v.tokens[i].word)));
  const taken = new Set(answers.map(normalizeWord));
  const lengths = new Set(answers.map((a) => a.length));
  const decoys = shuffle(
    [...new Set(decoyPool.map(bankWord))].filter(
      (w) => !taken.has(normalizeWord(w)) && !isStopword(w) && [...lengths].some((l) => Math.abs(l - w.length) <= 1),
    ),
    rng,
  ).slice(0, DECOYS);

  return { verses: built, bank: shuffle([...answers, ...decoys], rng) };
}

function bankWord(word: string) {
  return word.toLowerCase().replace(/’/g, "'");
}

// Flattened list of blanks in play order, with the verse each belongs to.
export function blankOrder(puzzle: FillBlanksPuzzle) {
  return puzzle.verses.flatMap((v, verseIndex) =>
    v.blanks.map((tokenIndex) => ({ verseIndex, tokenIndex, answer: bankWord(v.tokens[tokenIndex].word) })),
  );
}

export function isRightWord(choice: string, answer: string) {
  return normalizeWord(choice) === normalizeWord(answer);
}
