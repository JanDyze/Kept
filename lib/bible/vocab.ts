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

// Everyday words only (no rare names like "Iphtahel"), so decoys are plausible.
export async function commonWords(translation: string, limit = 1500) {
  return (await vocabulary(translation)).slice(0, limit);
}
