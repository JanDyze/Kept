import { isStopword, normalizeWord } from "../words";

// Turning a language model's guesses for a hidden word into fair wrong answers: real words from
// the same Bible, not names, not already in the verse, and not just another form of the answer
// ("loves" for "loved" would feel like a trick, not a test of memory).

const MAX = 8;

// English endings stripped to compare roots. Tagalog affixes are too varied to strip, so both
// languages also treat one word containing the other (4+ letters) as the same root.
const SUFFIXES = ["ness", "ing", "eth", "est", "ed", "es", "ly", "s", "d"];

function stem(word: string) {
  for (const s of SUFFIXES) if (word.length - s.length >= 3 && word.endsWith(s)) return word.slice(0, -s.length);
  return word;
}

export function sameRoot(a: string, b: string) {
  const x = normalizeWord(a);
  const y = normalizeWord(b);
  if (x === y || stem(x) === stem(y)) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 4 && long.includes(short);
}

export function pickAlternatives(
  original: string,
  guesses: string[], // the model's guesses, most likely first, as it printed them
  opts: { vocab: Set<string>; names: Set<string>; inVerse: Set<string>; max?: number },
) {
  const out: string[] = [];
  for (const raw of guesses) {
    const guess = raw.trim();
    if (!/^\p{L}{3,}$/u.test(guess) || /^\p{Lu}/u.test(guess)) continue; // fragments, punctuation, names
    const word = normalizeWord(guess);
    if (
      out.includes(word) ||
      isStopword(word) ||
      !opts.vocab.has(word) ||
      opts.names.has(word) ||
      opts.inVerse.has(word) ||
      sameRoot(word, original)
    )
      continue;
    out.push(word);
    if (out.length === (opts.max ?? MAX)) break;
  }
  return out;
}
