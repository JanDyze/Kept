import { shuffle, type Rng } from "./random";
import { isName, isStopword, normalizeWord, tokenize, type Token } from "./words";

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
  bank: string[]; // answers plus decoys, shuffled, lowercase except names
};

// Blanks are filled in reading order across all verses; mistakes are tracked per verse.
export type FillBlanksState = { filled: number; mistakes: number[]; gaveUp?: boolean };

// Decoys: first words that fit the blanks' places (`alternatives`, from lib/games/ai: normalized
// word → words a language model would put there), a few from each blank; then, to make up the
// number, words from `decoyPool` of a similar length.
export function buildFillBlanks(
  verses: { id: string; reference: string; translation: string; text: string }[],
  decoyPool: string[],
  rng: Rng,
  names?: Set<string>,
  alternatives?: Record<string, string[]>,
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

  const answers = built.flatMap((v) =>
    v.blanks.map((i) => (isName(v.tokens, i, names) ? v.tokens[i].word.replace(/’/g, "'") : bankWord(v.tokens[i].word))),
  );
  const taken = new Set(answers.map(normalizeWord));
  const lengths = new Set(answers.map((a) => a.length));
  const usable = (w: string) => !taken.has(normalizeWord(w)) && !isStopword(w);

  // Round-robin over the blanks (in a shuffled order), taking each one's likeliest fits first.
  const fits = shuffle(answers, rng).map((a) => (alternatives?.[normalizeWord(a)] ?? []).slice(0, 3));
  const decoys: string[] = [];
  for (let rank = 0; rank < 3 && decoys.length < DECOYS; rank++) {
    for (const list of fits) {
      const w = list[rank] && bankWord(list[rank]);
      if (w && usable(w) && !decoys.includes(w)) decoys.push(w);
      if (decoys.length === DECOYS) break;
    }
  }
  decoys.push(
    ...shuffle(
      [...new Set(decoyPool.map(bankWord))].filter(
        (w) => usable(w) && !decoys.includes(w) && [...lengths].some((l) => Math.abs(l - w.length) <= 1),
      ),
      rng,
    ).slice(0, DECOYS - decoys.length),
  );

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

// Rounds: each verse is played on its own. The round is the verse of the next blank to fill
// (the last verse once all are filled), so saved games resume in the right round.
export function roundAt(puzzle: FillBlanksPuzzle, filled: number) {
  const order = blankOrder(puzzle);
  return order[Math.min(filled, order.length - 1)]?.verseIndex ?? 0;
}

// A round's word choices: its own answers plus the puzzle's decoys, in the bank's shuffled order.
export function roundBank(puzzle: FillBlanksPuzzle, round: number) {
  const order = blankOrder(puzzle);
  const decoys = [...puzzle.bank];
  for (const b of order) {
    const at = decoys.findIndex((w) => isRightWord(w, b.answer));
    if (at !== -1) decoys.splice(at, 1);
  }
  const wanted = [...order.filter((b) => b.verseIndex === round).map((b) => b.answer), ...decoys];
  return puzzle.bank.filter((word) => {
    const at = wanted.findIndex((w) => isRightWord(w, word));
    if (at === -1) return false;
    wanted.splice(at, 1);
    return true;
  });
}
