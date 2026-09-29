import { normalizeWord, tokenize, type Token } from "./words";

// Type it out and Say it: the whole verse from memory, typed or spoken. Each check grades the
// attempt word by word; the right words show, the rest stay blank for the next try.

export const RECITE_TRIES = 3;
const MIN_WORDS = 4;
const MAX_WORDS = 80; // longer passages are too much to type or say in one go

export type RecitePuzzle = {
  verseId: string;
  reference: string;
  translation: string;
  tokens: Token[];
};

// attempts: what was typed or heard at each check, in order.
export type ReciteState = { attempts: string[]; gaveUp?: boolean };

export type ReciteGame = "type_it" | "say_it";

export function buildRecite(verse: { id: string; reference: string; translation: string; text: string }): RecitePuzzle | null {
  const tokens = tokenize(verse.text);
  if (tokens.length < MIN_WORDS || tokens.length > MAX_WORDS) return null;
  return { verseId: verse.id, reference: verse.reference, translation: verse.translation, tokens };
}

// Capitals, accents and punctuation don't count.
const clean = (w: string) => normalizeWord(w).replace(/[^\p{L}]/gu, "");

function letterDistance(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

// Speech is heard, not typed: in Say it a letter off in a longer word ("shepard") still counts.
function sameWord(said: string, word: string, lenient: boolean) {
  if (said === word) return true;
  return lenient && Math.min(said.length, word.length) >= 4 && letterDistance(said, word) <= 1;
}

export type WordMark = "right" | "wrong" | "missing";

// Lines an attempt up against the verse with a word-level edit distance, so one skipped or extra
// word doesn't throw off everything after it. Each verse word comes back right, wrong (something
// else said in its place) or missing; `extra` counts words that aren't in the verse.
export function grade(tokens: Token[], text: string, lenient = false) {
  const verse = tokens.map((t) => clean(t.word));
  const said = (text.match(/[\p{L}\p{M}'’-]+/gu) ?? []).map(clean).filter(Boolean);
  const n = verse.length;
  const m = said.length;
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + (sameWord(said[j - 1], verse[i - 1], lenient) ? 0 : 1),
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
      );

  const marks: WordMark[] = Array(n).fill("missing");
  let extra = 0;
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (sameWord(said[j - 1], verse[i - 1], lenient) ? 0 : 1)) {
      marks[i - 1] = sameWord(said[j - 1], verse[i - 1], lenient) ? "right" : "wrong";
      i--;
      j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
      marks[--i] = "missing";
    } else {
      extra++;
      j--;
    }
  }
  return { marks, extra, errors: cost[n][m] };
}

// Typing must be word for word. Speech recognition mishears now and then, so Say it passes at 90%.
export function passes(game: ReciteGame, puzzle: RecitePuzzle, text: string) {
  const { errors } = grade(puzzle.tokens, text, game === "say_it");
  return game === "type_it" ? errors === 0 : errors <= Math.floor(puzzle.tokens.length / 10);
}

export function reciteOutcome(game: ReciteGame, puzzle: RecitePuzzle, state: ReciteState) {
  if (state.gaveUp) return "lost" as const;
  const last = state.attempts.at(-1);
  if (last !== undefined && passes(game, puzzle, last)) return "won" as const;
  return state.attempts.length >= RECITE_TRIES ? ("lost" as const) : ("playing" as const);
}
