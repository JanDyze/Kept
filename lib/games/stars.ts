import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameStars } from "@/lib/db/schema";
import { GAME_IDS, type GameId } from "./registry";

// The games a user starred, first starred first.
export async function starredGames(userId: string): Promise<GameId[]> {
  const rows = await db
    .select({ game: gameStars.game })
    .from(gameStars)
    .where(eq(gameStars.userId, userId))
    .orderBy(asc(gameStars.createdAt));
  return rows.map((r) => r.game as GameId);
}

export async function setGameStar(userId: string, game: string, starred: boolean) {
  const id = GAME_IDS.find((g) => g === game);
  if (!id) return false;
  if (starred) await db.insert(gameStars).values({ userId, game: id }).onConflictDoNothing();
  else await db.delete(gameStars).where(and(eq(gameStars.userId, userId), eq(gameStars.game, id)));
  return true;
}

// Starred games first (in the order they were starred), then the rest in shelf order.
export function starredFirst<T>(items: T[], gameOf: (item: T) => GameId, starred: GameId[]) {
  const rank = (item: T) => {
    const i = starred.indexOf(gameOf(item));
    return i === -1 ? starred.length : i;
  };
  return items.map((item, i) => ({ item, i })).sort((a, b) => rank(a.item) - rank(b.item) || a.i - b.i).map((x) => x.item);
}
