"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { keepCard, setCardVisibility, type Visibility } from "@/lib/social/gallery";

const id = z.uuid();

// Keeps someone's card as a verse of your own, in their card's style.
export async function keepSharedCard(verseId: string): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  if (!id.safeParse(verseId).success) return { error: "That card can't be kept." };
  const result = await keepCard(user.id, verseId);
  if ("id" in result) revalidatePath("/", "layout");
  return result;
}

// Who can see a card of yours besides you: only you, your friends, or everyone (Discover).
export async function setVisibility(verseId: string, visibility: Visibility): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!id.safeParse(verseId).success || !["private", "friends", "everyone"].includes(visibility))
    return { error: "That can't be changed." };
  if (!(await setCardVisibility(user.id, verseId, visibility))) return { error: "This verse can't be found." };
  revalidatePath(`/verses/${verseId}`);
  revalidatePath("/search");
  return {};
}
