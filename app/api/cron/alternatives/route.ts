import { inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { verseAlternatives, verses } from "@/lib/db/schema";
import { ensureAlternatives, textHash } from "@/lib/games/ai/alternatives";

export const maxDuration = 300;

const BUDGET_MS = 240_000; // stop taking new verses with time to spare
const CHUNK = 500;

// Daily Vercel cron (and a one-off backfill): works out the games' word alternatives
// (lib/games/ai) for kept verses that don't have them yet, e.g. from before they existed or when a
// background run after saving was cut short. ?limit=N caps a run. Open without the secret in dev.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const dev = process.env.NODE_ENV === "development";
  if (!dev && (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const limit = Math.max(1, Math.min(500, Number(new URL(request.url).searchParams.get("limit")) || 100));
  const started = Date.now();

  const kept = await db
    .selectDistinct({ translation: verses.translation, text: verses.text })
    .from(verses)
    .where(isNull(verses.archivedAt));
  const byHash = new Map(kept.map((v) => [textHash(v.translation, v.text), v]));
  const hashes = [...byHash.keys()];
  const done = new Set<string>();
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const rows = await db
      .select({ hash: verseAlternatives.textHash })
      .from(verseAlternatives)
      .where(inArray(verseAlternatives.textHash, hashes.slice(i, i + CHUNK)));
    for (const r of rows) done.add(r.hash);
  }
  const todo = hashes.filter((h) => !done.has(h));

  let worked = 0;
  for (const hash of todo.slice(0, limit)) {
    if (Date.now() - started > BUDGET_MS) break;
    const v = byHash.get(hash)!;
    await ensureAlternatives(v.translation, v.text);
    worked++;
  }
  return Response.json({ verses: hashes.length, had: done.size, worked, left: todo.length - worked, ms: Date.now() - started });
}
