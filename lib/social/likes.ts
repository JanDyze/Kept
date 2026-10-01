import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardLikes, verseLikes } from "@/lib/db/schema";
import type { Reaction } from "@/lib/reactions";

// Likes raise shared cards in the Discover gallery and passages in Popular. One per person, and
// only a count is ever shown: who liked what stays private.

export type LikeInfo = { count: number; liked: boolean };
// A card's likes come in kinds (lib/reactions.ts): yours, and the commonest few.
export type CardLikeInfo = LikeInfo & { reaction: string | null; top: string[] };
export type Place = { bookNumber: number; chapter: number; verseStart: number };

export const placeKey = (p: Place) => `${p.bookNumber}:${p.chapter}:${p.verseStart}`;

// Likes a card with a reaction (true is the heart), changes the kind, or takes it back (false).
export async function setCardLike(userId: string, verseId: string, liked: boolean | Reaction) {
  const reaction = liked === true ? "heart" : liked;
  if (reaction)
    await db
      .insert(cardLikes)
      .values({ userId, verseId, reaction })
      .onConflictDoUpdate({ target: [cardLikes.verseId, cardLikes.userId], set: { reaction } });
  else await db.delete(cardLikes).where(and(eq(cardLikes.userId, userId), eq(cardLikes.verseId, verseId)));
}

// The three commonest reactions on a card, as SQL over `verse id` (most first).
export const topReactions = (verseId: unknown) =>
  sql<string[]>`coalesce((select array_agg(reaction order by n desc, reaction) from (
    select r.reaction, count(*) as n from ${cardLikes} r where r.verse_id = ${verseId} group by r.reaction order by n desc, r.reaction limit 3
  ) t), '{}')`;

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
  if (verseIds.length === 0) return new Map<string, CardLikeInfo>();
  const rows = await db
    .select({
      verseId: cardLikes.verseId,
      count: sql<number>`count(*)::int`,
      liked: sql<boolean>`bool_or(${cardLikes.userId} = ${viewerId})`,
      reaction: sql<string | null>`max(${cardLikes.reaction}) filter (where ${cardLikes.userId} = ${viewerId})`,
      top: topReactions(cardLikes.verseId),
    })
    .from(cardLikes)
    .where(inArray(cardLikes.verseId, verseIds))
    .groupBy(cardLikes.verseId);
  return new Map(rows.map((r) => [r.verseId, { count: r.count, liked: Boolean(r.liked), reaction: r.reaction, top: r.top ?? [] }]));
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
