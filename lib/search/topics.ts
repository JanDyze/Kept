// Turning a search like "depressed", "mothers" or "kaarawan" into OpenBible topics.

export type TopicInfo = { topic: string; votes: number }; // votes: total across the topic, for popularity
export type TopicMatch = { topic: string; score: number };

// Tagalog search words → English topic names (the topic data is English).
const TAGALOG: Record<string, string> = {
  kaarawan: "birthday",
  ina: "mothers",
  nanay: "mothers",
  inay: "mothers",
  ama: "fathers",
  tatay: "fathers",
  itay: "fathers",
  magulang: "parents",
  anak: "children",
  pamilya: "family",
  kaibigan: "friendship",
  asawa: "marriage",
  kasal: "marriage",
  "pag-ibig": "love",
  pagibig: "love",
  "pag-asa": "hope",
  pagasa: "hope",
  pananampalataya: "faith",
  panalangin: "prayer",
  dasal: "prayer",
  kapayapaan: "peace",
  kagalakan: "joy",
  kaligayahan: "happiness",
  kalungkutan: "sadness",
  malungkot: "sadness",
  lungkot: "sadness",
  depresyon: "depression",
  "pag-aalala": "anxiety",
  pagkabalisa: "anxiety",
  balisa: "anxiety",
  takot: "fear",
  lakas: "strength",
  kalakasan: "strength",
  patawad: "forgiveness",
  pagpapatawad: "forgiveness",
  paggaling: "healing",
  kagalingan: "healing",
  sakit: "sickness",
  karamdaman: "sickness",
  kamatayan: "death",
  pagdadalamhati: "grief",
  pighati: "grief",
  pasasalamat: "thankfulness",
  salamat: "thankfulness",
  trabaho: "work",
  hanapbuhay: "work",
  pera: "money",
  salapi: "money",
  karunungan: "wisdom",
  katapatan: "faithfulness",
  pagtitiis: "patience",
  pasensya: "patience",
  kababaang: "humility",
  kapakumbabaan: "humility",
  kaligtasan: "salvation",
  biyaya: "grace",
  awa: "mercy",
  habag: "mercy",
  tukso: "temptation",
  kasalanan: "sin",
  galit: "anger",
  inggit: "envy",
  kabataan: "youth",
  pag_aaral: "education",
  pagaaral: "education",
  paglalakbay: "travel",
  bagong_taon: "new year",
  pasko: "christmas",
  mag_isa: "loneliness",
  pag_iisa: "loneliness",
};

export function normalizeQuery(q: string) {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// English meaning of a (possibly Tagalog) query.
export function translateQuery(q: string) {
  const n = normalizeQuery(q);
  const key = n.replace(/\s+/g, "_");
  if (TAGALOG[n] ?? TAGALOG[key]) return TAGALOG[n] ?? TAGALOG[key];
  // Word by word: "takot at pag-aalala" → "fear anxiety"
  const words = n.split(" ").filter((w) => w !== "at" && w !== "ng" && w !== "sa" && w !== "mga");
  const mapped = words.map((w) => TAGALOG[w]);
  return mapped.some(Boolean) ? words.map((w, i) => mapped[i] ?? w).join(" ") : n;
}

function forms(word: string) {
  const out = new Set([word]);
  if (word.endsWith("ies")) out.add(word.slice(0, -3) + "y");
  else if (word.endsWith("es")) out.add(word.slice(0, -2));
  if (word.endsWith("s") && !word.endsWith("ss")) out.add(word.slice(0, -1));
  if (word.endsWith("y")) out.add(word.slice(0, -1) + "ies");
  else out.add(word + "s");
  return out;
}

// Shared beginning for related word forms: "depression" / "depressed" → "depres". At least six
// letters, so "birthday" doesn't reach "birth control".
function stem(word: string) {
  return word.slice(0, Math.max(6, word.length - 3));
}

export function matchTopics(query: string, topics: TopicInfo[], limit = 6): TopicMatch[] {
  const q = translateQuery(query);
  if (q.length < 2) return [];
  const qForms = forms(q);
  const qWords = q.split(" ");
  const qStems = qWords.filter((w) => w.length >= 7).map(stem);
  const maxVotes = Math.max(1, ...topics.map((t) => t.votes));

  const scored: (TopicMatch & { votes: number })[] = [];
  for (const { topic, votes } of topics) {
    let score = 0;
    const words = topic.split(" ");
    if (qForms.has(topic)) score = 1;
    else if (qWords.length > 1 && qWords.every((w) => words.some((tw) => forms(w).has(tw)))) score = 0.8;
    else if (qWords.length === 1 && words.some((tw) => qForms.has(tw))) score = 0.6;
    else if (qStems.length > 0 && qStems.every((s) => words.some((tw) => tw.startsWith(s)))) score = 0.5;
    if (score === 0) continue;
    // Shorter, more popular topics are more on point ("being depressed" over "depression in teenagers").
    const focus = 1 / Math.sqrt(words.length);
    scored.push({ topic, votes, score: score * (0.75 + 0.25 * focus) + 0.05 * (votes / maxVotes) });
  }
  return scored
    .sort((a, b) => b.score - a.score || b.votes - a.votes)
    .slice(0, limit)
    .map(({ topic, score }) => ({ topic, score }));
}

export type TopicVerseRow = {
  topic: string;
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  votes: number;
};

export type RankedVerse = {
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  score: number;
  topics: string[];
};

// Blend verses across matched topics. Votes are scaled within each topic so one huge topic
// doesn't drown out the others. Ranges starting on the same verse ("Prov 31:25-30" and
// "Prov 31:25-31") count as one passage: their scores add up and the best-voted range is shown.
export function rankVerses(matches: TopicMatch[], rows: TopicVerseRow[], limit = 30): RankedVerse[] {
  const weight = new Map(matches.map((m) => [m.topic, m.score]));
  const topVotes = new Map<string, number>();
  for (const r of rows) topVotes.set(r.topic, Math.max(topVotes.get(r.topic) ?? 0, r.votes));

  const byStart = new Map<string, RankedVerse>();
  const best = new Map<string, number>(); // strongest single vote share seen per passage
  for (const r of rows) {
    const w = weight.get(r.topic);
    if (!w) continue;
    const key = `${r.bookNumber}:${r.chapter}:${r.verseStart}`;
    const add = w * Math.sqrt(r.votes / (topVotes.get(r.topic) ?? r.votes));
    const hit = byStart.get(key);
    if (!hit) {
      byStart.set(key, { bookNumber: r.bookNumber, chapter: r.chapter, verseStart: r.verseStart, verseEnd: r.verseEnd, score: add, topics: [r.topic] });
      best.set(key, add);
      continue;
    }
    hit.score += add;
    if (!hit.topics.includes(r.topic)) hit.topics.push(r.topic);
    if (add > best.get(key)!) {
      best.set(key, add);
      hit.verseEnd = r.verseEnd;
    }
  }
  return [...byStart.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
