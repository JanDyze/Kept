import data from "./books.json";

export type Book = {
  number: number; // 1–66, Bible order
  name: string; // English name, as stored on verses
  tl: string; // MBBTAG (Tagalog) name
  verses: number[]; // verse count per chapter
};

export const BOOKS: Book[] = data;

export type ParsedReference = {
  book: Book;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
};

export type ParseResult = { ok: true; ref: ParsedReference } | { ok: false; error: string };

// Short forms that prefix matching alone can't resolve (or resolves wrongly).
const ALIASES: Record<string, string> = {
  gn: "Genesis", ge: "Genesis",
  ex: "Exodus", exo: "Exodus",
  lv: "Leviticus", le: "Leviticus",
  nm: "Numbers", nu: "Numbers",
  dt: "Deuteronomy", de: "Deuteronomy",
  jos: "Joshua", jsh: "Joshua",
  jdg: "Judges", jg: "Judges", jgs: "Judges", judg: "Judges",
  rt: "Ruth", ru: "Ruth",
  "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1kgs": "1 Kings", "2kgs": "2 Kings", "1kg": "1 Kings", "2kg": "2 Kings",
  jb: "Job",
  ps: "Psalms", psa: "Psalms", psm: "Psalms", pss: "Psalms", psalm: "Psalms",
  pr: "Proverbs", prv: "Proverbs",
  ec: "Ecclesiastes", qoh: "Ecclesiastes",
  so: "Song of Solomon", sos: "Song of Solomon", sg: "Song of Solomon", songofsongs: "Song of Solomon",
  songs: "Song of Solomon", canticles: "Song of Solomon",
  is: "Isaiah",
  je: "Jeremiah", jr: "Jeremiah",
  la: "Lamentations",
  ezk: "Ezekiel",
  dn: "Daniel",
  jl: "Joel",
  am: "Amos",
  ob: "Obadiah",
  jnh: "Jonah", jon: "Jonah",
  mi: "Micah",
  na: "Nahum", nah: "Nahum",
  hb: "Habakkuk",
  zp: "Zephaniah",
  hg: "Haggai",
  zc: "Zechariah",
  ml: "Malachi",
  mt: "Matthew",
  mk: "Mark", mrk: "Mark", mr: "Mark",
  lk: "Luke",
  jn: "John", jhn: "John",
  rm: "Romans",
  php: "Philippians", pp: "Philippians", phil: "Philippians",
  phm: "Philemon", phlm: "Philemon", philem: "Philemon",
  jas: "James", jm: "James",
  "1jn": "1 John", "2jn": "2 John", "3jn": "3 John",
  jud: "Jude", jd: "Jude",
  rv: "Revelation", revelations: "Revelation", apocalypse: "Revelation",
};

const ORDINALS: [RegExp, string][] = [
  [/^(iii|3rd|third|ikatlong)\s+/, "3 "],
  [/^(ii|2nd|second|ikalawang)\s+/, "2 "],
  [/^(i|1st|first|unang)\s+/, "1 "],
];

function normalizeBook(input: string) {
  let s = input.toLowerCase().trim().replace(/\./g, " ").replace(/\s+/g, " ");
  for (const [re, digit] of ORDINALS) s = s.replace(re, digit);
  return s.replace(/^mga /, "").replace(/ /g, "");
}

const byKey = new Map<string, Book>();
for (const b of BOOKS) {
  byKey.set(normalizeBook(b.name), b);
  byKey.set(normalizeBook(b.tl), b);
}
const byName = new Map(BOOKS.map((b) => [b.name, b]));

export function bookByName(name: string) {
  return byName.get(name);
}

export function bookByNumber(n: number) {
  return BOOKS[n - 1];
}

export function findBook(input: string): Book | null {
  const key = normalizeBook(input);
  if (!key) return null;
  const alias = ALIASES[key];
  if (alias) return byName.get(alias) ?? null;
  const exact = byKey.get(key);
  if (exact) return exact;
  if (key.replace(/^\d/, "").length < 2) return null;
  // Unique prefix of an English or Tagalog name: "rom" → Romans, "gal" → Galatians.
  const hits = new Set<Book>();
  for (const [k, b] of byKey) if (k.startsWith(key)) hits.add(b);
  return hits.size === 1 ? [...hits][0] : null;
}

const REF = /^(.+?)\s*(\d+)(?:\s*[:.\s]\s*(\d+)(?:\s*[-–—]\s*(\d+)(?:\s*[:.]\s*(\d+))?)?)?\s*$/;

// Parses "John 3:16", "jn 3 16", "1 Cor 13:4-7", "Juan 3:16". Ranges stay within one chapter.
export function parseReference(input: string): ParseResult {
  const m = input.trim().match(REF);
  if (!m) return { ok: false, error: "Type a reference like John 3:16." };
  const [, bookPart, ch, vs, ve, veAfterColon] = m;

  const book = findBook(bookPart);
  if (!book) return { ok: false, error: `Can't find a book called "${bookPart.trim()}".` };

  const chapter = Number(ch);
  if (chapter < 1 || chapter > book.verses.length) {
    return { ok: false, error: `${book.name} has ${book.verses.length} chapters.` };
  }
  if (!vs) return { ok: false, error: "Add a verse number, like " + `${book.name} ${chapter}:1.` };
  if (veAfterColon) return { ok: false, error: "Ranges must stay within one chapter." };

  const max = book.verses[chapter - 1];
  const verseStart = Number(vs);
  const end = ve ? Number(ve) : null;
  if (verseStart < 1 || verseStart > max || (end !== null && end > max)) {
    return { ok: false, error: `${book.name} ${chapter} has ${max} verses.` };
  }
  if (end !== null && end < verseStart) return { ok: false, error: "The range ends before it starts." };

  return { ok: true, ref: { book, chapter, verseStart, verseEnd: end === verseStart ? null : end } };
}

export function formatReference(bookName: string, chapter: number, verseStart: number, verseEnd?: number | null) {
  return `${bookName} ${chapter}:${verseStart}${verseEnd && verseEnd !== verseStart ? `-${verseEnd}` : ""}`;
}

// URL segment for a book: "1 Corinthians" → "1-corinthians".
export function bookSlug(book: Book) {
  return book.name.toLowerCase().replace(/\s+/g, "-");
}

export function bookBySlug(slug: string) {
  return BOOKS.find((b) => bookSlug(b) === slug.toLowerCase());
}

// Previous / next chapter across book boundaries.
export function adjacentChapter(book: Book, chapter: number, step: 1 | -1) {
  if (chapter + step >= 1 && chapter + step <= book.verses.length) return { book, chapter: chapter + step };
  const other = BOOKS[book.number - 1 + step];
  if (!other) return null;
  return { book: other, chapter: step === 1 ? 1 : other.verses.length };
}
