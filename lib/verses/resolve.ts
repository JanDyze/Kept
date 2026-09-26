import "server-only";
import { bookByNumber } from "@/lib/bible/books";
import { getPassage } from "@/lib/bible/lookup";
import { isLookupTranslation } from "@/lib/bible/translations";
import { resolveVerseInput, toColumns, type ResolvedVerse, type VerseField, type VerseInput } from "./input";

export type ResolveResult = { ok: true; verse: ResolvedVerse } | { ok: false; errors: Partial<Record<VerseField, string>> };

// Validates input and, for ESV / MBBTAG, replaces the text with the imported copy so Scripture text
// can't be edited. Where the translation merges verses, the reference widens to the whole passage.
export async function resolveVerse(input: VerseInput): Promise<ResolveResult> {
  const result = resolveVerseInput(input);
  if (!result.ok) return result;

  const verse = result.verse;
  if (!isLookupTranslation(verse.translation)) return result;

  const book = bookByNumber(verse.bookNumber);
  const passage = await getPassage(verse.translation, {
    book,
    chapter: verse.chapter,
    verseStart: verse.verseStart,
    verseEnd: verse.verseEnd,
  });
  if (!passage) return { ok: false, errors: { reference: `${verse.translation} doesn't include ${verse.reference}.` } };

  const start = Math.min(verse.verseStart, passage.verseStart);
  const end = Math.max(verse.verseEnd ?? verse.verseStart, passage.verseEnd);
  return {
    ok: true,
    verse: {
      ...verse,
      ...toColumns({ book, chapter: verse.chapter, verseStart: start, verseEnd: end === start ? null : end }),
      text: passage.text,
    },
  };
}
