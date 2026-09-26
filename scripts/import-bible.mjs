// Loads local Bible copies into the private bible_verses table so the app can auto-fill verses.
// Run once (safe to re-run): npm run bible:import
// The source folders are gitignored; the text never leaves this machine except into your database.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const books = JSON.parse(readFileSync("lib/bible/books.json", "utf8"));
const numberByName = new Map(books.map((b) => [b.name, b.number]));

// translation code → folder of per-book JSON files ({ book, chapters: [{ chapter, verses: [{ verse, text }] }] }).
// mergesVerses: a gap in numbering means the previous entry prints several verses as one (MBBTAG).
// Otherwise a gap is a verse the translation omits, like ESV's footnoted Acts 8:37.
const SOURCES = {
  ESV: { dir: "ESV/books", mergesVerses: false },
  MBBTAG: { dir: "MBBTAG", mergesVerses: true },
};

function load(translation, { dir, mergesVerses }) {
  const rows = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json")) {
    const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
    const bookNumber = numberByName.get(data.book);
    if (!bookNumber) throw new Error(`${translation}: unknown book "${data.book}" in ${file}`);
    const chapterCounts = books[bookNumber - 1].verses;

    for (const { chapter, verses } of data.chapters) {
      const sorted = [...verses].sort((a, b) => a.verse - b.verse);
      sorted.forEach((v, i) => {
        // A gap before the next verse means this entry merges the verses in between.
        const next = sorted[i + 1]?.verse ?? chapterCounts[chapter - 1] + 1;
        rows.push({
          translation,
          book_number: bookNumber,
          chapter,
          verse: v.verse,
          verse_end: mergesVerses ? Math.max(v.verse, next - 1) : v.verse,
          text: v.text.trim(),
        });
      });
    }
  }
  return rows;
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL?.replace(":6543/", ":5432/");
if (!url) throw new Error("DATABASE_URL is not set in .env.local");
const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

try {
  for (const [translation, source] of Object.entries(SOURCES)) {
    if (!existsSync(source.dir)) {
      console.log(`${translation}: ${source.dir}/ not found, skipped`);
      continue;
    }
    const rows = load(translation, source);
    await sql.begin(async (tx) => {
      await tx`delete from bible_verses where translation = ${translation}`;
      for (let i = 0; i < rows.length; i += 2000) await tx`insert into bible_verses ${tx(rows.slice(i, i + 2000))}`;
    });
    const merged = rows.filter((r) => r.verse_end > r.verse).length;
    console.log(`${translation}: ${rows.length} verses imported (${merged} entries span merged verses)`);
  }
} finally {
  await sql.end();
}
