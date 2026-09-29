import "server-only";
import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { after } from "next/server";
import { isLookupTranslation } from "@/lib/bible/translations";
import { properNames, vocabulary } from "@/lib/bible/vocab";
import { db } from "@/lib/db";
import { verseAlternatives } from "@/lib/db/schema";
import { isName, isPlainWord, isStopword, normalizeWord, tokenize } from "../words";
import { pickAlternatives } from "./filter";

// Wrong answers that fit: a small language model (a "fill-mask" model, free from Hugging Face,
// run here with Transformers.js, no API or key) reads each verse with one word hidden and says
// which words could go there. Those guesses, filtered (./filter.ts), make Fill the Blanks decoys
// and Spot the Change swaps that can't be spotted by grammar alone.
// Worked out once per verse text, in the background after a verse is saved, and kept in
// verse_alternatives; games read them from there and fall back to word lists when they're missing.
// KEPT_AI=off turns it off.

const MODELS = {
  en: { id: "Xenova/distilbert-base-uncased", mask: "[MASK]" }, // ~67 MB
  tl: { id: "Xenova/xlm-roberta-base", mask: "<mask>" }, // ~280 MB, many languages incl. Tagalog
} as const;
type Lang = keyof typeof MODELS;

const TOP_K = 40;
const enabled = () => process.env.KEPT_AI !== "off";
const langOf = (translation: string): Lang => (translation === "MBBTAG" ? "tl" : "en");
// Typed-in translations ("Other") check words against the English Bible.
const wordListOf = (translation: string) => (isLookupTranslation(translation) ? translation : "ESV");

export function textHash(translation: string, text: string) {
  return createHash("sha256").update(`${translation}\n${text.trim()}`).digest("hex");
}

type FillMask = (texts: string[], opts: { top_k: number }) => Promise<{ token_str: string }[][]>;
const models = new Map<Lang, Promise<FillMask>>();

function model(lang: Lang) {
  let loading = models.get(lang);
  if (!loading) {
    loading = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      // A serverless host can only write to /tmp; locally the download stays in node_modules/.cache.
      if (process.env.VERCEL) env.cacheDir = "/tmp/hf";
      const fill = await pipeline("fill-mask", MODELS[lang].id, { dtype: "q8" });
      return (async (texts, opts) => {
        const out = (await fill(texts, opts)) as unknown[];
        // A list per text, though some versions give a single text's guesses unwrapped.
        return (Array.isArray(out[0]) ? out : [out]) as { token_str: string }[][];
      }) as FillMask;
    })();
    loading.catch(() => models.delete(lang));
    models.set(lang, loading);
  }
  return loading;
}

// Each meaningful word of the verse (normalized) → up to 8 alternatives, most likely first.
export async function computeAlternatives(translation: string, text: string) {
  const lang = langOf(translation);
  const list = wordListOf(translation);
  const [fill, vocab, names] = await Promise.all([model(lang), vocabulary(list), properNames(list)]);
  const vocabSet = new Set(vocab);
  const tokens = tokenize(text);
  const inVerse = new Set(tokens.map((t) => normalizeWord(t.word)));

  // The first place each word appears, hidden in turn.
  const seen = new Set<string>();
  const targets = tokens.flatMap((t, i) => {
    const word = normalizeWord(t.word);
    if (seen.has(word) || !isPlainWord(t.word) || t.word.length < 3 || isStopword(t.word) || isName(tokens, i, names)) return [];
    seen.add(word);
    return [i];
  });
  if (targets.length === 0) return {};

  const masked = targets.map((target) =>
    tokens.map((t, i) => t.pre + (i === target ? MODELS[lang].mask : t.word) + t.post).join(""),
  );
  const guesses = await fill(masked, { top_k: TOP_K });
  const words: Record<string, string[]> = {};
  targets.forEach((target, k) => {
    const original = normalizeWord(tokens[target].word);
    const picked = pickAlternatives(original, guesses[k].map((g) => g.token_str), { vocab: vocabSet, names, inVerse });
    if (picked.length) words[original] = picked;
  });
  return words;
}

// Works out and saves a verse's alternatives unless they're already saved. Errors are logged, not
// thrown: games simply use their word lists without them.
export async function ensureAlternatives(translation: string, text: string) {
  if (!enabled()) return;
  const hash = textHash(translation, text);
  try {
    const [found] = await db
      .select({ hash: verseAlternatives.textHash })
      .from(verseAlternatives)
      .where(eq(verseAlternatives.textHash, hash))
      .limit(1);
    if (found) return;
    const words = await computeAlternatives(translation, text);
    await db
      .insert(verseAlternatives)
      .values({ textHash: hash, translation, model: MODELS[langOf(translation)].id, words })
      .onConflictDoNothing();
  } catch (e) {
    console.error("Verse alternatives failed:", e instanceof Error ? e.message : e);
  }
}

// After the response is sent (a saved verse, a day's games), so nobody waits on the model.
export function queueAlternatives(items: { translation: string; text: string }[]) {
  if (!enabled() || items.length === 0) return;
  after(async () => {
    for (const v of items) await ensureAlternatives(v.translation, v.text);
  });
}

// Saved alternatives for these verses, by verse id. Verses without any are left out.
export async function alternativesFor<V extends { id: string; translation: string; text: string }>(list: V[]) {
  const byHash = new Map(list.map((v) => [textHash(v.translation, v.text), v]));
  const out = new Map<string, Record<string, string[]>>();
  if (!enabled() || byHash.size === 0) return { found: out, missing: [] as V[] };
  const rows = await db
    .select({ hash: verseAlternatives.textHash, words: verseAlternatives.words })
    .from(verseAlternatives)
    .where(inArray(verseAlternatives.textHash, [...byHash.keys()]));
  for (const r of rows) out.set(byHash.get(r.hash)!.id, r.words);
  return { found: out, missing: list.filter((v) => !out.has(v.id)) };
}
