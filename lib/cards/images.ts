import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardImages, verses } from "@/lib/db/schema";
import { deleteImage, putImage } from "./storage";

// A user's card photos. Every query is scoped by userId (RLS doesn't cover the app's connection).

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_IMAGES_PER_USER = 100;

// Recognized by their first bytes, not the name or the type the browser claims.
const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
];

export function sniffImage(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

export async function listCardImages(userId: string) {
  return db
    .select({ id: cardImages.id })
    .from(cardImages)
    .where(eq(cardImages.userId, userId))
    .orderBy(desc(cardImages.createdAt));
}

export async function getCardImage(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(cardImages)
    .where(and(eq(cardImages.userId, userId), eq(cardImages.id, id)))
    .limit(1);
  return row ?? null;
}

export async function ownsCardImage(userId: string, id: string) {
  return Boolean(await getCardImage(userId, id));
}

export type SaveImageResult = { ok: true; id: string } | { ok: false; error: string; status: number };

export async function saveCardImage(userId: string, bytes: Uint8Array): Promise<SaveImageResult> {
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, error: "That photo is too large.", status: 413 };
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: "Use a JPEG, PNG or WebP photo.", status: 415 };

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cardImages)
    .where(eq(cardImages.userId, userId));
  if (count >= MAX_IMAGES_PER_USER) return { ok: false, error: "Delete a photo to add another.", status: 409 };

  const id = crypto.randomUUID();
  const storageKey = `${userId}/${id}.${kind.ext}`;
  await putImage(storageKey, bytes);
  try {
    await db.insert(cardImages).values({ id, userId, storageKey, contentType: kind.type, byteSize: bytes.byteLength });
  } catch (error) {
    await deleteImage(storageKey);
    throw error;
  }
  return { ok: true, id };
}

// Removes the photo and puts any card that used it back on the theme's background.
export async function deleteCardImage(userId: string, id: string) {
  const row = await getCardImage(userId, id);
  if (!row) return false;
  await db
    .update(verses)
    .set({ card: sql`jsonb_set(${verses.card}, '{bg}', '{"kind":"theme"}'::jsonb)` })
    .where(and(eq(verses.userId, userId), sql`${verses.card}->'bg'->>'image' = ${id}`));
  await db.delete(cardImages).where(and(eq(cardImages.userId, userId), eq(cardImages.id, id)));
  await deleteImage(row.storageKey);
  return true;
}
