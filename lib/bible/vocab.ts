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

// Everyday words for decoys: the most frequent ones, so no rare words like "Iphtahel"; hyphenated
// words kept whole ("kataas-taasang", not "taasang"); and no names ("Jose", "Jerusalem"), told
// apart as the words written with a capital most of the time.
const common = new Map<string, Promise<string[]>>();
const COMMON_LIMIT = 1500;

export function commonWords(translation: string): Promise<string[]> {
  let words = common.get(translation);
  if (!words) {
    words = db
      .execute<{ w: string }>(
        sql`select lower(w) as w
            from bible_verses, regexp_split_to_table(text, '[^[:alpha:]''’-]+') as w
            where translation = ${translation} and length(w) between 3 and 12 and w ~ '^[[:alpha:]].*[[:alpha:]]$'
            group by 1
            having count(*) filter (where w ~ '^[[:lower:]]') * 2 > count(*)
            order by count(*) desc
            limit ${COMMON_LIMIT}`,
      )
      .then((rows) => [...new Set(rows.map((r) => normalizeWord(r.w)))]);
    words.catch(() => common.delete(translation));
    common.set(translation, words);
  }
  return words;
}
