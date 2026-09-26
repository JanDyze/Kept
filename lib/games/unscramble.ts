import { shuffle, type Rng } from "./random";
import { tokenize } from "./words";

const MAX_TILES = 12;
export const MIN_UNSCRAMBLE_WORDS = 4;

export type UnscramblePuzzle = {
  verseId: string;
  reference: string;
  translation: string;
  chunks: string[]; // in the verse's order
  order: number[]; // chunk indexes as shown, shuffled
};

// used: chunk indexes tapped so far, in order (tiles with repeated text are interchangeable).
export type UnscrambleState = { used: number[]; mistakes: number; gaveUp?: boolean };

// Long verses are cut into 2–3 word phrases so there are never more than ~12 tiles.
export function chunkVerse(text: string): string[] {
  const words = tokenize(text).map((t) => `${t.pre}${t.word}${t.post}`.trim());
  const size = Math.max(1, Math.ceil(words.length / MAX_TILES));
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size).join(" "));
  return chunks;
}

export function buildUnscramble(
  verse: { id: string; reference: string; translation: string; text: string },
  rng: Rng,
): UnscramblePuzzle | null {
  const chunks = chunkVerse(verse.text);
  if (chunks.length < MIN_UNSCRAMBLE_WORDS) return null;
  const inOrder = chunks.map((_, i) => i);
  let order = shuffle(inOrder, rng);
  // Never hand out the answer already solved.
  for (let tries = 0; tries < 5 && order.every((c, i) => c === i); tries++) order = shuffle(inOrder, rng);
  return { verseId: verse.id, reference: verse.reference, translation: verse.translation, chunks, order };
}

// Repeated phrases ("the LORD") are interchangeable: any unused tile with the right text counts.
export function isNextChunk(puzzle: UnscramblePuzzle, used: number[], chunkIndex: number) {
  return !used.includes(chunkIndex) && puzzle.chunks[chunkIndex] === puzzle.chunks[used.length];
}
