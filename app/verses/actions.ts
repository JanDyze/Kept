"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { formatReference, parseReference } from "@/lib/bible/books";
import { getPassage } from "@/lib/bible/lookup";
import { isLookupTranslation } from "@/lib/bible/translations";
import { db } from "@/lib/db";
import { verses } from "@/lib/db/schema";
import type { VerseField } from "@/lib/verses/input";
import { insertNote } from "@/lib/verses/notes";
import { resolveVerse } from "@/lib/verses/resolve";

export type VerseFormState = {
  errors?: Partial<Record<VerseField | "form", string>>;
};

const idSchema = z.uuid();

export async function saveVerse(_prev: VerseFormState, formData: FormData): Promise<VerseFormState> {
  const user = await requireUser();

  const result = await resolveVerse({
    reference: String(formData.get("reference") ?? ""),
    translation: String(formData.get("translation") ?? ""),
    text: String(formData.get("text") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  });
  if (!result.ok) return { errors: result.errors };

  // Notes are a thread on the verse page (verse_notes); a new verse's note starts it.
  const { notes: firstNote, ...verse } = result.verse;
  const rawId = formData.get("id");
  let id: string;
  if (rawId) {
    const parsedId = idSchema.safeParse(rawId);
    if (!parsedId.success) return { errors: { form: "This verse can't be found." } };
    const updated = await db
      .update(verses)
      .set(verse)
      .where(and(eq(verses.id, parsedId.data), eq(verses.userId, user.id)))
      .returning({ id: verses.id });
    if (updated.length === 0) return { errors: { form: "This verse can't be found." } };
    id = updated[0].id;
  } else {
    const [created] = await db
      .insert(verses)
      .values({ ...verse, userId: user.id })
      .returning({ id: verses.id });
    id = created.id;
    if (firstNote) await insertNote(user.id, id, firstNote);
  }

  revalidatePath("/", "layout");
  redirect(`/verses/${id}`);
}

export async function setArchived(id: string, archived: boolean) {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return;

  await db
    .update(verses)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(verses.id, parsedId.data), eq(verses.userId, user.id)));

  revalidatePath("/", "layout");
}

export type LookupResult =
  | { ok: true; text: string; reference: string; note: string | null }
  | { ok: false; error: string };

// Previews verse text from the imported ESV / MBBTAG copies. Saving looks it up again server-side.
export async function lookupPassage(reference: string, translation: string): Promise<LookupResult> {
  await requireUser();
  if (!isLookupTranslation(translation)) return { ok: false, error: `No ${translation} text to fill from.` };

  const parsed = parseReference(reference);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { ref } = parsed;

  const passage = await getPassage(translation, ref);
  const asked = formatReference(ref.book.name, ref.chapter, ref.verseStart, ref.verseEnd);
  if (!passage) return { ok: false, error: `${translation} doesn't include ${asked}.` };

  // Merged verses can only widen the range; omitted ones never shrink it.
  const covered = formatReference(
    ref.book.name,
    ref.chapter,
    Math.min(ref.verseStart, passage.verseStart),
    Math.max(ref.verseEnd ?? ref.verseStart, passage.verseEnd),
  );
  const notes: string[] = [];
  if (covered !== asked) {
    notes.push(`${translation} prints these verses together, so it will be saved as ${covered}.`);
  }
  if (passage.omitted.length > 0) {
    const list = passage.omitted.join(", ");
    notes.push(`${translation} doesn't include verse${passage.omitted.length > 1 ? "s" : ""} ${list}.`);
  }

  return { ok: true, text: passage.text, reference: covered, note: notes.join(" ") || null };
}

export type KeepResult = { ok: true; id: string; reference: string } | { ok: false; error: string };

// Keeps a verse in one tap (Discover): the imported ESV / MBBTAG text, no tags or notes yet.
export async function keepVerse(reference: string, translation: string): Promise<KeepResult> {
  const user = await requireUser();
  if (!isLookupTranslation(translation)) return { ok: false, error: "That translation can't be kept in one tap." };

  const result = await resolveVerse({ reference, translation, text: "", notes: "", tags: "" });
  if (!result.ok) return { ok: false, error: Object.values(result.errors)[0] ?? "That verse can't be kept." };

  const [created] = await db
    .insert(verses)
    .values({ ...result.verse, notes: null, userId: user.id })
    .returning({ id: verses.id, reference: verses.reference });
  revalidatePath("/", "layout");
  return { ok: true, ...created };
}
