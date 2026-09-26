// Loads the OpenBible.info Topical Bible (CC BY 4.0, www.openbible.info/topics) into topic_verses.
// Run once, or again to refresh (the source updates weekly): npm run topics:import
// Uses data/topic-votes.txt if present, otherwise downloads it there.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const SOURCE = "https://a.openbible.info/data/topic-votes.txt";
const FILE = "data/topic-votes.txt";
const MIN_VOTES = 2; // single votes are mostly noise

const books = JSON.parse(readFileSync("lib/bible/books.json", "utf8"));

async function load() {
  if (!existsSync(FILE)) {
    console.log(`Downloading ${SOURCE}`);
    // The host rejects clients without a browser-like user agent.
    const res = await fetch(SOURCE, { headers: { "user-agent": "Mozilla/5.0 (Kept verse memorizer)" } });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    mkdirSync("data", { recursive: true });
    writeFileSync(FILE, await res.text());
  }
  return readFileSync(FILE, "utf8");
}

// Verse IDs are bbcccvvv. Ranges crossing a chapter are cut at the end of the first chapter.
function parse(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/).slice(1)) {
    const [topic, start, end, votesRaw] = line.split("\t");
    const votes = Number(votesRaw);
    if (!topic || !/^\d{8}$/.test(start ?? "") || !(votes >= MIN_VOTES)) continue;
    const bookNumber = Number(start.slice(0, 2));
    const chapter = Number(start.slice(2, 5));
    const verseStart = Number(start.slice(5));
    const book = books[bookNumber - 1];
    if (!book || chapter > book.verses.length) continue;
    let verseEnd = null;
    if (/^\d{8}$/.test(end ?? "")) {
      const sameChapter = end.slice(0, 5) === start.slice(0, 5);
      verseEnd = sameChapter ? Number(end.slice(5)) : book.verses[chapter - 1];
      if (verseEnd <= verseStart) verseEnd = null;
    }
    rows.push({ topic: topic.trim().toLowerCase(), book_number: bookNumber, chapter, verse_start: verseStart, verse_end: verseEnd, votes });
  }
  return rows;
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL?.replace(":6543/", ":5432/");
if (!url) throw new Error("DATABASE_URL is not set in .env.local");
const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

try {
  const rows = parse(await load());
  await sql.begin(async (tx) => {
    await tx`delete from topic_verses`;
    for (let i = 0; i < rows.length; i += 5000) await tx`insert into topic_verses ${tx(rows.slice(i, i + 5000))}`;
  });
  const topics = new Set(rows.map((r) => r.topic)).size;
  console.log(`${rows.length} topic links imported across ${topics} topics (votes >= ${MIN_VOTES})`);
} finally {
  await sql.end();
}
