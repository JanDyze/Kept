import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { normalizeWord } from "@/lib/games/words";

// Every distinct word in a translation, most frequent first, for checking Wordle guesses and
// picking decoys. Built once per server instance from bible_verses.
const cache = new Map<string, Promise<string[]>>();

export function vocabulary(translation: string): Promise<string[]> {
  let words = cache.get(translation);
  if (!words) {
    words = db
      .execute<{ w: string }>(
        sql`select lower(w) as w
            from bible_verses, regexp_split_to_table(text, '[^[:alpha:]]+') as w
            where translation = ${translation} and length(w) between 3 and 12
            group by 1
            order by count(*) desc`,
      )
      .then((rows) => [...new Set(rows.map((r) => normalizeWord(r.w)))]);
    words.catch(() => cache.delete(translation));
    cache.set(translation, words);
  }
  return words;
}

// Valid guesses for a Missing Word answer: words of the same length, always including the answer.
export async function wordsOfLength(translation: string, length: number, answer: string) {
  const all = await vocabulary(translation);
  const set = new Set(all.filter((w) => w.length === length && /^\p{L}+$/u.test(w)));
  set.add(answer);
  return [...set];
}

// Words split by case, most frequent first. Hyphenated words stay whole ("kataas-taasang", not
// "taasang"). A word counts as capitalized when it's written with a capital most of the time: a
// name ("Jose", "Jerusalem") or "God", "Diyos", "LORD".
const byCase = new Map<string, Promise<{ lower: string[]; capitalized: string[] }>>();

function wordsByCase(translation: string) {
  let words = byCase.get(translation);
  if (!words) {
    words = db
      .execute<{ w: string; capitalized: boolean }>(
        sql`select lower(w) as w, count(*) filter (where w ~ '^[[:lower:]]') * 2 <= count(*) as capitalized
            from bible_verses, regexp_split_to_table(text, '[^[:alpha:]''’-]+') as w
            where translation = ${translation} and length(w) between 3 and 12 and w ~ '^[[:alpha:]].*[[:alpha:]]$'
            group by 1
            order by count(*) desc`,
      )
      .then((rows) => ({
        lower: [...new Set(rows.filter((r) => !r.capitalized).map((r) => normalizeWord(r.w)))],
        capitalized: [...new Set(rows.filter((r) => r.capitalized).map((r) => normalizeWord(r.w)))],
      }));
    words.catch(() => byCase.delete(translation));
    byCase.set(translation, words);
  }
  return words;
}

// Everyday words for decoys: the most frequent ones (no rare words like "Iphtahel") and no names.
export async function commonWords(translation: string, limit = 1500) {
  return (await wordsByCase(translation)).lower.slice(0, limit);
}

// Names and the like, which keep their capital when shown.
export async function properNames(translation: string) {
  return new Set((await wordsByCase(translation)).capitalized);
}
