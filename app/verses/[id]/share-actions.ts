"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sharePath, startSharing, stopSharing } from "@/lib/cards/share";

const id = z.uuid();

// Turns on the card's public link (or returns the existing one).
export async function shareCard(verseId: string): Promise<{ path: string } | { error: string }> {
  const user = await requireUser();
  if (!id.safeParse(verseId).success) return { error: "This verse can't be found." };
  const token = await startSharing(user.id, verseId);
  if (!token) return { error: "This verse can't be found." };
  revalidatePath(`/verses/${verseId}`);
  return { path: sharePath(token) };
}

export async function unshareCard(verseId: string): Promise<void> {
  const user = await requireUser();
  if (!id.safeParse(verseId).success) return;
  await stopSharing(user.id, verseId);
  revalidatePath(`/verses/${verseId}`);
}
