import { z } from "zod";
import { parseReference, formatReference, type ParsedReference } from "@/lib/bible/books";
import { isLookupTranslation } from "@/lib/bible/translations";
import { normalizeTags } from "./tags";

export const verseInputSchema = z.object({
  reference: z.string().trim().min(1, "Enter a reference, like John 3:16."),
  translation: z.string().trim().min(1, "Choose a translation.").max(20, "Keep the translation name short."),
  // Ignored for ESV / MBBTAG: their text always comes from the imported copy (lib/verses/resolve.ts).
  text: z.string().trim().max(5000, "That's longer than a passage should be.").default(""),
  notes: z.string().trim().max(2000, "Notes can be up to 2,000 characters.").default(""),
  tags: z.union([z.string(), z.array(z.string())]).default(""),
});

export type VerseInput = z.input<typeof verseInputSchema>;
export type VerseField = keyof VerseInput;

export type ResolvedVerse = {
  reference: string;
  book: string;
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  translation: string;
  text: string;
  notes: string | null;
  tags: string[];
};

export function toColumns(ref: ParsedReference) {
  return {
    reference: formatReference(ref.book.name, ref.chapter, ref.verseStart, ref.verseEnd),
    book: ref.book.name,
    bookNumber: ref.book.number,
    chapter: ref.chapter,
    verseStart: ref.verseStart,
    verseEnd: ref.verseEnd,
  };
}

const TEXT_REQUIRED = "Add the verse text.";

// Validates raw input and resolves the reference. Doesn't fill ESV / MBBTAG text; the server-side
// resolveVerse() in lib/verses/resolve.ts does that and is what actions and MCP tools should call.
export function resolveVerseInput(
  input: VerseInput,
): { ok: true; verse: ResolvedVerse } | { ok: false; errors: Partial<Record<VerseField, string>> } {
  const parsed = verseInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Partial<Record<VerseField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as VerseField;
      errors[field] ??= issue.message;
    }
    // Report a bad reference alongside the other problems, not after they're fixed.
    const ref = typeof input.reference === "string" && input.reference.trim() ? parseReference(input.reference) : null;
    if (ref && !ref.ok) errors.reference ??= ref.error;
    return { ok: false, errors };
  }

  const { reference, translation, text, notes, tags } = parsed.data;
  const ref = parseReference(reference);
  const needsText = !isLookupTranslation(translation.toUpperCase()) && !text;
  if (!ref.ok || needsText) {
    return {
      ok: false,
      errors: { ...(!ref.ok && { reference: ref.error }), ...(needsText && { text: TEXT_REQUIRED }) },
    };
  }

  return {
    ok: true,
    verse: {
      ...toColumns(ref.ref),
      translation: translation.toUpperCase(),
      text,
      notes: notes || null,
      tags: normalizeTags(tags),
    },
  };
}
