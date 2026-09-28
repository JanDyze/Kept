import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyGames, verses } from "@/lib/db/schema";
import { streak } from "@/lib/games/daily";
import { friendIds } from "./friends";

// A person's public numbers, shown on their profile to anyone signed in: how long their streak is,
// how many verses they keep, games won, and friends. Counts only; what's in the verses stays theirs.
export type ProfileStats = { streak: number; verses: number; gamesWon: number; friends: number };

export async function profileStats(userId: string, day: string): Promise<ProfileStats> {
  const [days, [kept], [won], friends] = await Promise.all([
    streak(userId, day),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(verses)
      .where(and(eq(verses.userId, userId), isNull(verses.archivedAt))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(dailyGames)
      .where(and(eq(dailyGames.userId, userId), eq(dailyGames.status, "won"))),
    friendIds(userId),
  ]);
  return { streak: days, verses: kept?.n ?? 0, gamesWon: won?.n ?? 0, friends: friends.length };
}
