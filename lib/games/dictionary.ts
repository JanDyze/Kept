import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeWord } from "./words";

// English words (sindresorhus/word-list: plurals and verb forms included) for Missing Word guesses
// that aren't in the verse's Bible text. Read from node_modules at runtime; next.config.ts ships it.
let english: Promise<Set<string>> | null = null;

export function isEnglishWord(word: string) {
  if (!english) {
    english = readFile(join(process.cwd(), "node_modules/word-list/words.txt"), "utf8").then(
      (text) => new Set(text.split("\n").map((w) => normalizeWord(w.trim()))),
    );
    english.catch(() => (english = null));
  }
  return english.then((words) => words.has(normalizeWord(word)));
}
