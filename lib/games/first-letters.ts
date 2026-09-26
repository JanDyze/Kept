import { normalizeWord, tokenize, type Token } from "./words";

export const MIN_FIRST_LETTER_WORDS = 4;

export type FirstLettersPuzzle = {
  verseId: string;
  reference: string;
  translation: string;
  tokens: Token[];
};

// typed: words completed so far; each wrong word or revealed word counts as a mistake.
export type FirstLettersState = { typed: number; mistakes: number; gaveUp?: boolean };

export function buildFirstLetters(verse: { id: string; reference: string; translation: string; text: string }): FirstLettersPuzzle | null {
  const tokens = tokenize(verse.text);
  if (tokens.length < MIN_FIRST_LETTER_WORDS) return null;
  return { verseId: verse.id, reference: verse.reference, translation: verse.translation, tokens };
}

// The hint shown for a word: its first letter, then a dot per remaining letter ("F··").
export function hint(word: string) {
  return word.charAt(0) + "·".repeat(Math.max(0, [...word].length - 1));
}

// Punctuation and accents don't count; "lord" matches "LORD", "kayat" matches "kaya't".
export function sameWord(typed: string, word: string) {
  const clean = (w: string) => normalizeWord(w).replace(/[^\p{L}]/gu, "");
  return clean(typed) !== "" && clean(typed) === clean(word);
}
