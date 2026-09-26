// Translations whose text is loaded into bible_verses (see scripts/import-bible.mjs).
export const LOOKUP_TRANSLATIONS = ["ESV", "MBBTAG"] as const;
export type LookupTranslation = (typeof LOOKUP_TRANSLATIONS)[number];

export function isLookupTranslation(t: string): t is LookupTranslation {
  return (LOOKUP_TRANSLATIONS as readonly string[]).includes(t);
}
