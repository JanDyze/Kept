import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardImages, verses } from "@/lib/db/schema";
import { getImage } from "./storage";
import { readCardStyle } from "./style";

// Public links to a card (/s/<token>). A token exists only while its owner shares the card; stopping
// clears it, so an old link simply stops working. Nothing about the owner is exposed.

export const sharePath = (token: string) => `/s/${token}`;

// 12 url-safe characters: ~71 bits, not guessable.
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Buffer.from(bytes).toString("base64url");
}

export async function startSharing(userId: string, verseId: string) {
  const [verse] = await db
    .select({ token: verses.shareToken })
    .from(verses)
    .where(and(eq(verses.id, verseId), eq(verses.userId, userId)))
    .limit(1);
  if (!verse) return null;
  if (verse.token) return verse.token;
  const token = newToken();
  await db
    .update(verses)
    .set({ shareToken: token })
    .where(and(eq(verses.id, verseId), eq(verses.userId, userId)));
  return token;
}

export async function stopSharing(userId: string, verseId: string) {
  await db
    .update(verses)
    .set({ shareToken: null })
    .where(and(eq(verses.id, verseId), eq(verses.userId, userId)));
}

// The shared card, as the public may see it: the verse and its style, nothing else.
export async function getSharedCard(token: string) {
  if (!/^[\w-]{8,32}$/.test(token)) return null;
  const [row] = await db
    .select({
      userId: verses.userId,
      reference: verses.reference,
      book: verses.book,
      translation: verses.translation,
      text: verses.text,
      card: verses.card,
    })
    .from(verses)
    .where(eq(verses.shareToken, token))
    .limit(1);
  if (!row) return null;
  return { ...row, style: readCardStyle(row.card) };
}

// The photo behind a shared card, if it has one and it still exists.
export async function getSharedPhoto(token: string) {
  const shared = await getSharedCard(token);
  const bg = shared?.style?.bg;
  if (!shared || bg?.kind !== "image") return null;
  const [image] = await db
    .select()
    .from(cardImages)
    .where(and(eq(cardImages.id, bg.image), eq(cardImages.userId, shared.userId)))
    .limit(1);
  const bytes = image && (await getImage(image.storageKey));
  return image && bytes ? { bytes, contentType: image.contentType } : null;
}
