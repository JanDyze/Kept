"use server";

import { and, between, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { BOOKS } from "@/lib/bible/books";
import { HIGHLIGHTS } from "@/lib/bible/highlights";
import { db } from "@/lib/db";
import { highlights } from "@/lib/db/schema";

const input = z.object({
  bookNumber: z.number().int().min(1).max(66),
  chapter: z.number().int().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1),
  color: z.enum(Object.keys(HIGHLIGHTS) as [keyof typeof HIGHLIGHTS]).nullable(),
});

// Highlights verses start..end of a chapter in a color, or clears them (color null).
export async function setHighlight(value: z.input<typeof input>): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = input.safeParse(value);
  if (!parsed.success) return { error: "That highlight can't be saved." };
  const { bookNumber, chapter, start, end, color } = parsed.data;
  const book = BOOKS[bookNumber - 1];
  const last = book.verses[chapter - 1];
  if (!last || end < start || end > last || end - start > 200) return { error: "That highlight can't be saved." };

  const where = and(
    eq(highlights.userId, user.id),
    eq(highlights.bookNumber, bookNumber),
    eq(highlights.chapter, chapter),
    between(highlights.verse, start, end),
  );
  if (color === null) await db.delete(highlights).where(where);
  else {
    const rows = Array.from({ length: end - start + 1 }, (_, i) => ({ userId: user.id, bookNumber, chapter, verse: start + i, color }));
    await db
      .insert(highlights)
      .values(rows)
      .onConflictDoUpdate({ target: [highlights.userId, highlights.bookNumber, highlights.chapter, highlights.verse], set: { color, createdAt: new Date() } });
  }
  revalidatePath("/bible", "layout");
  return {};
}
