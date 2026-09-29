"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { ownsCardImage } from "@/lib/cards/images";
import { cardStyleSchema } from "@/lib/cards/style";
import { db } from "@/lib/db";
import { verses } from "@/lib/db/schema";

// Saves a verse's card, or clears it (null) back to the plain page, then returns to the verse.
export async function saveCard(verseId: string, style: unknown): Promise<{ error: string }> {
  const user = await requireUser();
  if (!z.uuid().safeParse(verseId).success) return { error: "This verse can't be found." };

  let card = null;
  if (style !== null) {
    const parsed = cardStyleSchema.safeParse(style);
    if (!parsed.success) return { error: "That card can't be saved. Try again." };
    if (parsed.data.bg.kind === "image" && !(await ownsCardImage(user.id, parsed.data.bg.image)))
      return { error: "That photo is gone. Pick another." };
    card = parsed.data;
  }

  const updated = await db
    .update(verses)
    .set({ card })
    .where(and(eq(verses.id, verseId), eq(verses.userId, user.id)))
    .returning({ id: verses.id });
  if (updated.length === 0) return { error: "This verse can't be found." };

  revalidatePath("/verses", "layout");
  redirect(`/verses/${verseId}`, RedirectType.replace); // Back from the verse skips the editor
}
