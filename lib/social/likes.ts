import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardLikes, verseLikes } from "@/lib/db/schema";

// Likes raise shared cards in the Discover gallery and passages in Popular. One per person, and
// only a count is ever shown: who liked what stays private.

export type LikeInfo = { count: number; liked: boolean };
export type Place = { bookNumber: number; chapter: number; verseStart: number };

export const placeKey = (p: Place) => `${p.bookNumber}:${p.chapter}:${p.verseStart}`;

export async function setCardLike(userId: string, verseId: string, liked: boolean) {
  if (liked) await db.insert(cardLikes).values({ userId, verseId }).onConflictDoNothing();
  else await db.delete(cardLikes).where(and(eq(cardLikes.userId, userId), eq(cardLikes.verseId, verseId)));
}

export async function setVerseLike(userId: string, place: Place, liked: boolean) {
  if (liked) await db.insert(verseLikes).values({ userId, ...place }).onConflictDoNothing();
  else
    await db
      .delete(verseLikes)
      .where(
        and(
          eq(verseLikes.userId, userId),
          eq(verseLikes.bookNumber, place.bookNumber),
          eq(verseLikes.chapter, place.chapter),
          eq(verseLikes.verseStart, place.verseStart),
        ),
      );
}

export async function cardLikeInfo(viewerId: string, verseIds: string[]) {
  if (verseIds.length === 0) return new Map<string, LikeInfo>();
  const rows = await db
    .select({
      verseId: cardLikes.verseId,
      count: sql<number>`count(*)::int`,
      liked: sql<boolean>`bool_or(${cardLikes.userId} = ${viewerId})`,
    })
    .from(cardLikes)
    .where(inArray(cardLikes.verseId, verseIds))
    .groupBy(cardLikes.verseId);
  return new Map(rows.map((r) => [r.verseId, { count: r.count, liked: Boolean(r.liked) }]));
}

export async function verseLikeInfo(viewerId: string, places: Place[]) {
  if (places.length === 0) return new Map<string, LikeInfo>();
  const keys = sql.join(
    places.map((p) => sql`(${p.bookNumber}::int, ${p.chapter}::int, ${p.verseStart}::int)`),
    sql`, `,
  );
  const rows = await db.execute<{ book_number: number; chapter: number; verse_start: number; count: number; liked: boolean }>(sql`
    select book_number, chapter, verse_start, count(*)::int as count, bool_or(user_id = ${viewerId}) as liked
    from ${verseLikes}
    where (book_number, chapter, verse_start) in (${keys})
    group by 1, 2, 3`);
  return new Map(
    rows.map((r) => [placeKey({ bookNumber: r.book_number, chapter: r.chapter, verseStart: r.verse_start }), { count: r.count, liked: Boolean(r.liked) }]),
  );
}
