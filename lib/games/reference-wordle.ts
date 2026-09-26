import { BOOKS, formatReference } from "@/lib/bible/books";

export const REFERENCE_GUESSES = 6;
const FIRST_NT_BOOK = 40; // Matthew

export type ReferenceAnswer = {
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
};

export type ReferenceWordlePuzzle = {
  verseId: string;
  translation: string;
  text: string;
  reference: string;
  answer: ReferenceAnswer;
};

export type ReferenceGuess = { bookNumber: number; chapter: number; verse: number };
export type ReferenceWordleState = { guesses: ReferenceGuess[]; gaveUp?: boolean };

export type Direction = "correct" | "higher" | "lower";

export type ReferenceHint = {
  book: Direction; // higher = the answer is later in the Bible
  sameTestament: boolean;
  near: boolean; // within 3 books
  chapter: Direction | null; // only once the book is right
  verse: Direction | null; // only once book and chapter are right
};

function direction(guess: number, lo: number, hi = lo): Direction {
  if (guess < lo) return "higher";
  if (guess > hi) return "lower";
  return "correct";
}

export function referenceHint(guess: ReferenceGuess, answer: ReferenceAnswer): ReferenceHint {
  const book = direction(guess.bookNumber, answer.bookNumber);
  const chapter = book === "correct" ? direction(guess.chapter, answer.chapter) : null;
  const verse =
    chapter === "correct" ? direction(guess.verse, answer.verseStart, answer.verseEnd ?? answer.verseStart) : null;
  return {
    book,
    sameTestament: guess.bookNumber >= FIRST_NT_BOOK === answer.bookNumber >= FIRST_NT_BOOK,
    near: Math.abs(guess.bookNumber - answer.bookNumber) <= 3,
    chapter,
    verse,
  };
}

export function isValidGuess(g: ReferenceGuess) {
  const book = BOOKS[g.bookNumber - 1];
  return Boolean(
    book && g.chapter >= 1 && g.chapter <= book.verses.length && g.verse >= 1 && g.verse <= book.verses[g.chapter - 1],
  );
}

export function isCorrect(hint: ReferenceHint) {
  return hint.verse === "correct";
}

export function formatGuess(g: ReferenceGuess) {
  return formatReference(BOOKS[g.bookNumber - 1].name, g.chapter, g.verse);
}

export function referenceOutcome(puzzle: Pick<ReferenceWordlePuzzle, "answer">, state: ReferenceWordleState) {
  if (state.guesses.some((g) => isCorrect(referenceHint(g, puzzle.answer)))) return "won" as const;
  if (state.gaveUp || state.guesses.length >= REFERENCE_GUESSES) return "lost" as const;
  return "playing" as const;
}
