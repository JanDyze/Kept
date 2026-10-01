"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyCardReaction } from "@/lib/notify";
import { z } from "zod";
import { GUEST_NOT_ALLOWED, requireUser } from "@/lib/auth";
import { galleryCard, keepCard, setCardVisibility, type Visibility } from "@/lib/social/gallery";
import { setCardLike, setVerseLike } from "@/lib/social/likes";
import { isReaction, type Reaction } from "@/lib/reactions";

const id = z.uuid();

// Keeps someone's card as a verse of your own, in their card's style.
export async function keepSharedCard(verseId: string): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  if (user.guest) return { error: GUEST_NOT_ALLOWED };
  if (!id.safeParse(verseId).success) return { error: "That card can't be kept." };
  const result = await keepCard(user.id, verseId);
  if ("id" in result) revalidatePath("/", "layout");
  return result;
}

// Likes someone's card, with a reaction when held (true is the heart), or takes it back (false).
// Only cards the viewer may see, and not their own.
export async function likeCard(verseId: string, liked: boolean | Reaction): Promise<{ error?: string }> {
  const user = await requireUser();
  if (user.guest) return { error: GUEST_NOT_ALLOWED };
  if (!id.safeParse(verseId).success || (typeof liked !== "boolean" && !isReaction(liked))) return { error: "That card can't be liked." };
  const found = await galleryCard(user.id, verseId);
  if (!found || found.isOwner) return { error: "That card can't be liked." };
  const isNew = await setCardLike(user.id, verseId, liked);
  if (isNew && liked) {
    const reaction = liked === true ? "heart" : liked;
    after(() => notifyCardReaction(found.row.userId, user.id, { id: verseId, reference: found.reference }, reaction));
  }
  return {};
}

const place = z.object({
  bookNumber: z.number().int().min(1).max(66),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(200),
});

// Likes a passage in Discover → Verses (or takes the like back).
export async function likeVerse(where: { bookNumber: number; chapter: number; verseStart: number }, liked: boolean): Promise<{ error?: string }> {
  const user = await requireUser();
  if (user.guest) return { error: GUEST_NOT_ALLOWED };
  const parsed = place.safeParse(where);
  if (!parsed.success) return { error: "That verse can't be liked." };
  await setVerseLike(user.id, parsed.data, Boolean(liked));
  return {};
}

// Who can see a card of yours besides you: only you, your friends, or everyone (Discover).
export async function setVisibility(verseId: string, visibility: Visibility): Promise<{ error?: string }> {
  const user = await requireUser();
  if (user.guest && visibility !== "private") return { error: GUEST_NOT_ALLOWED };
  if (!id.safeParse(verseId).success || !["private", "friends", "everyone"].includes(visibility))
    return { error: "That can't be changed." };
  if (!(await setCardVisibility(user.id, verseId, visibility))) return { error: "This verse can't be found." };
  revalidatePath(`/verses/${verseId}`);
  revalidatePath("/search");
  return {};
}
