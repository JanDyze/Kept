import { pick, shuffle, type Rng } from "./random";
import { isPlainWord, isStopword, normalizeWord, tokenize, type Token } from "./words";

export const SPOT_LIVES = 3;

export type SpotChangePuzzle = {
  verseId: string;
  reference: string;
  translation: string;
  tokens: Token[]; // with the swapped words already in place
  changed: number[]; // token indexes that were swapped
  originals: string[]; // the real word for each changed index, same order
};

// found: changed indexes tapped; misses: taps on words that weren't changed.
export type SpotChangeState = { found: number[]; misses: number; gaveUp?: boolean };

function matchCase(word: string, like: string) {
  if (like === like.toUpperCase() && like.length > 1) return word.toUpperCase();
  if (/^\p{Lu}/u.test(like)) return word.charAt(0).toUpperCase() + word.slice(1);
  return word;
}

// Swaps 1–3 meaningful words (by verse length). A word with `alternatives` (from lib/games/ai:
// words a language model would put in its place) becomes one of its three likeliest, so the change
// reads naturally; words without any fall back to a similar-length word from `pool`.
export function buildSpotChange(
  verse: { id: string; reference: string; translation: string; text: string },
  pool: string[],
  rng: Rng,
  alternatives?: Record<string, string[]>,
): SpotChangePuzzle | null {
  const tokens = tokenize(verse.text);
  const candidates = tokens.flatMap((t, i) => (isPlainWord(t.word) && t.word.length >= 3 && !isStopword(t.word) ? [i] : []));
  if (candidates.length < 2) return null;
  const count = tokens.length >= 30 ? 3 : tokens.length >= 12 ? 2 : 1;
  const inVerse = new Set(tokens.map((t) => normalizeWord(t.word)));
  const words = shuffle(
    [...new Set(pool.map(normalizeWord))].filter((w) => /^\p{L}+$/u.test(w) && !inVerse.has(w) && !isStopword(w)),
    rng,
  );

  const used = new Set<string>();
  const fitsFor = (i: number) =>
    (alternatives?.[normalizeWord(tokens[i].word)] ?? [])
      .slice(0, 3)
      .filter((w) => /^\p{L}+$/u.test(w) && !inVerse.has(w) && !used.has(w));

  const changed: number[] = [];
  const originals: string[] = [];
  const out = tokens.map((t) => ({ ...t }));
  // Words with a natural stand-in go first.
  const shuffled = shuffle(candidates, rng);
  const tryOrder = [...shuffled.filter((i) => fitsFor(i).length > 0), ...shuffled.filter((i) => fitsFor(i).length === 0)];
  for (const i of tryOrder) {
    if (changed.length === count) break;
    const fits = fitsFor(i);
    let swap: string;
    if (fits.length) swap = pick(fits, rng);
    else {
      const len = tokens[i].word.length;
      const swapIndex = words.findIndex((w) => Math.abs(w.length - len) <= 1 && !used.has(w));
      if (swapIndex === -1) continue;
      [swap] = words.splice(swapIndex, 1);
    }
    used.add(swap);
    originals.push(tokens[i].word);
    out[i].word = matchCase(swap, tokens[i].word);
    changed.push(i);
  }
  if (changed.length === 0) return null;
  const order = changed.map((c, k) => [c, originals[k]] as const).sort((a, b) => a[0] - b[0]);
  return {
    verseId: verse.id,
    reference: verse.reference,
    translation: verse.translation,
    tokens: out,
    changed: order.map(([c]) => c),
    originals: order.map(([, o]) => o),
  };
}

export function spotOutcome(puzzle: Pick<SpotChangePuzzle, "changed">, state: SpotChangeState) {
  if (state.gaveUp || state.misses >= SPOT_LIVES) return "lost" as const;
  if (puzzle.changed.every((c) => state.found.includes(c))) return "won" as const;
  return "playing" as const;
}
