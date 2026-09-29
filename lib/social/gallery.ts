import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { bookByName } from "@/lib/bible/books";
import { queueAlternatives } from "@/lib/games/ai/alternatives";
import { readCardStyle, type CardStyle } from "@/lib/cards/style";
import { db } from "@/lib/db";
import { cardLikes, verses } from "@/lib/db/schema";
import { resolveVerse } from "@/lib/verses/resolve";
import { friendIds } from "./friends";
import { getProfiles, type Profile } from "./profiles";

// Cards people chose to show: "everyone" cards to all signed-in users, "friends" cards to their
// friends. Nothing private ever leaves its owner.

export type Visibility = "private" | "friends" | "everyone";

export type GalleryCard = {
  id: string;
  reference: string; // with the Tagalog book name for MBBTAG
  translation: string;
  text: string;
  style: CardStyle;
  author: Profile;
  likes: number;
  liked: boolean; // by the viewer
};

const likeCount = sql<number>`(select count(*)::int from ${cardLikes} l where l.verse_id = ${verses.id})`;
const likedBy = (viewerId: string) =>
  sql<boolean>`exists (select 1 from ${cardLikes} l where l.verse_id = ${verses.id} and l.user_id = ${viewerId})`;
// Discover's order: likes lift a card, age lets it sink slowly (a like counts for about a day's
// head start), so new cards still get seen.
const hot = sql`(${likeCount} + 1) / power(extract(epoch from (now() - coalesce(${verses.publishedAt}, now()))) / 3600 + 2, 0.8)`;

// Whose cards the viewer may see, as a SQL condition on `verses`.
function visibleTo(viewerId: string, friends: string[]) {
  return or(
    eq(verses.userId, viewerId),
    eq(verses.visibility, "everyone"),
    friends.length ? and(eq(verses.visibility, "friends"), inArray(verses.userId, friends)) : undefined,
  );
}

function localReference(v: { reference: string; book: string; translation: string }) {
  const tl = v.translation === "MBBTAG" ? bookByName(v.book)?.tl : undefined;
  return tl ? v.reference.replace(v.book, tl) : v.reference;
}

// The gallery, the viewer's own shared cards included (so a share shows up at once): most liked
// and newest first. `scope: "friends"` keeps to friends' cards; `authorId` to one person's (their
// profile, newest first).
export async function galleryCards(
  viewerId: string,
  opts: { scope?: "all" | "friends"; authorId?: string; limit?: number } = {},
): Promise<GalleryCard[]> {
  const friends = await friendIds(viewerId);
  if (opts.scope === "friends" && friends.length === 0) return [];
  const rows = await db
    .select({
      id: verses.id,
      userId: verses.userId,
      reference: verses.reference,
      book: verses.book,
      translation: verses.translation,
      text: verses.text,
      card: verses.card,
      likes: likeCount,
      liked: likedBy(viewerId),
    })
    .from(verses)
    .where(
      and(
        isNotNull(verses.card),
        isNull(verses.archivedAt),
        ne(verses.visibility, "private"),
        visibleTo(viewerId, friends),
        opts.authorId ? eq(verses.userId, opts.authorId) : undefined,
        opts.scope === "friends" ? inArray(verses.userId, friends) : undefined,
      ),
    )
    .orderBy(...(opts.authorId ? [desc(verses.publishedAt)] : [desc(hot), desc(verses.publishedAt)]))
    .limit(opts.limit ?? 60);

  const authors = await getProfiles([...new Set(rows.map((r) => r.userId))]);
  return rows.flatMap((r) => {
    const style = readCardStyle(r.card);
    const author = authors.get(r.userId);
    if (!style || !author) return [];
    return [
      {
        id: r.id,
        reference: localReference(r),
        translation: r.translation,
        text: r.text,
        style,
        author,
        likes: Number(r.likes),
        liked: Boolean(r.liked),
      },
    ];
  });
}

// One card, if the viewer may see it.
export async function galleryCard(viewerId: string, verseId: string) {
  const friends = await friendIds(viewerId);
  const [row] = await db
    .select()
    .from(verses)
    .where(and(eq(verses.id, verseId), isNotNull(verses.card), isNull(verses.archivedAt), visibleTo(viewerId, friends)))
    .limit(1);
  if (!row) return null;
  const isOwner = row.userId === viewerId;
  if (!isOwner && row.visibility === "private") return null;
  const style = readCardStyle(row.card);
  const author = (await getProfiles([row.userId])).get(row.userId);
  if (!style || !author) return null;
  return { row, style, author, isOwner, reference: localReference(row) };
}

// May the viewer see this photo? Yes if it's theirs, or it's behind a card they may see.
export async function canSeeCardImage(viewerId: string, ownerId: string, imageId: string) {
  if (viewerId === ownerId) return true;
  const friends = await friendIds(viewerId);
  const [row] = await db
    .select({ id: verses.id })
    .from(verses)
    .where(
      and(
        eq(verses.userId, ownerId),
        isNull(verses.archivedAt),
        sql`${verses.card}->'bg'->>'image' = ${imageId}`,
        or(
          eq(verses.visibility, "everyone"),
          friends.includes(ownerId) ? eq(verses.visibility, "friends") : undefined,
        ),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function setCardVisibility(userId: string, verseId: string, visibility: Visibility) {
  const updated = await db
    .update(verses)
    .set({
      visibility,
      // Shown anew when it goes from private to shared; hidden again, it loses its place.
      publishedAt:
        visibility === "private"
          ? null
          : sql`case when ${verses.visibility} = 'private' or ${verses.publishedAt} is null then now() else ${verses.publishedAt} end`,
    })
    .where(and(eq(verses.id, verseId), eq(verses.userId, userId)))
    .returning({ id: verses.id });
  return updated.length > 0;
}

// Keeps someone's card: the verse joins your own, dressed in their card's style (a photo stays
// theirs, so a photo card comes over on a plain dark background). If you already have the verse,
// it keeps your version and only takes the style when yours has no card yet.
export async function keepCard(viewerId: string, verseId: string): Promise<{ id: string } | { error: string }> {
  const found = await galleryCard(viewerId, verseId);
  if (!found || found.isOwner) return { error: "That card can't be kept." };
  const { row, style } = found;
  const card: CardStyle = style.bg.kind === "image" ? { ...style, bg: { kind: "color", color: "night" } } : style;

  const [mine] = await db
    .select({ id: verses.id, card: verses.card })
    .from(verses)
    .where(
      and(
        eq(verses.userId, viewerId),
        eq(verses.bookNumber, row.bookNumber),
        eq(verses.chapter, row.chapter),
        eq(verses.verseStart, row.verseStart),
        eq(verses.translation, row.translation),
        isNull(verses.archivedAt),
      ),
    )
    .limit(1);
  if (mine) {
    if (!mine.card) await db.update(verses).set({ card }).where(eq(verses.id, mine.id));
    return { id: mine.id };
  }

  const resolved = await resolveVerse({ reference: row.reference, translation: row.translation, text: row.text, notes: "", tags: "" });
  if (!resolved.ok) return { error: "That verse can't be kept." };
  const [created] = await db
    .insert(verses)
    .values({ ...resolved.verse, notes: null, card, userId: viewerId })
    .returning({ id: verses.id });
  queueAlternatives([resolved.verse]);
  return { id: created.id };
}
