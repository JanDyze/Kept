"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";
import { GUEST_VERSE_LIMIT, requireUser, type SessionUser } from "@/lib/auth";
import { formatReference, parseReference } from "@/lib/bible/books";
import { getPassage } from "@/lib/bible/lookup";
import { isLookupTranslation } from "@/lib/bible/translations";
import { db } from "@/lib/db";
import { verses } from "@/lib/db/schema";
import type { VerseField } from "@/lib/verses/input";
import { readCardStyle, type CardStyle } from "@/lib/cards/style";
import { insertNote } from "@/lib/verses/notes";
import { resolveVerse } from "@/lib/verses/resolve";
import { SKIP_FIRST_VERSE_COOKIE } from "@/lib/verses/view";

export type VerseFormState = {
  errors?: Partial<Record<VerseField | "form", string>>;
};

const idSchema = z.uuid();

const GUEST_FULL = `Guests can keep ${GUEST_VERSE_LIMIT} verses. Save with Google to keep more.`;

// Guests keep a few verses (archived ones count too, so archiving isn't a way round it).
async function guestIsFull(user: SessionUser) {
  if (!user.guest) return false;
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(verses).where(eq(verses.userId, user.id));
  return (row?.n ?? 0) >= GUEST_VERSE_LIMIT;
}

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

  // Notes are a thread on the verse page (verse_notes); a new verse's note starts it. A new verse
  // can also be made a card straight away (a color picked in the add form).
  const { notes: firstNote, ...verse } = result.verse;
  let card: CardStyle | null = null;
  try {
    card = readCardStyle(JSON.parse(String(formData.get("card") || "null")));
  } catch {}
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
    if (await guestIsFull(user)) return { errors: { form: GUEST_FULL } };
    const [created] = await db
      .insert(verses)
      .values({ ...verse, card, userId: user.id })
      .returning({ id: verses.id });
    id = created.id;
    if (firstNote) await insertNote(user.id, id, firstNote);
  }

  revalidatePath("/", "layout");
  // The form's page is replaced, so Back from the verse doesn't open the form again.
  redirect(`/verses/${id}`, RedirectType.replace);
}

// "Skip" on Add verse for someone with nothing kept yet: back Home, which stops sending them here.
export async function skipFirstVerse() {
  (await cookies()).set(SKIP_FIRST_VERSE_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect("/", RedirectType.replace);
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

// Stars a verse (kept at the top of My verses) or takes the star off.
export async function setStarred(id: string, starred: boolean): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "This verse can't be found." };

  const updated = await db
    .update(verses)
    .set({ starredAt: starred ? new Date() : null })
    .where(and(eq(verses.id, parsedId.data), eq(verses.userId, user.id)))
    .returning({ id: verses.id });
  if (updated.length === 0) return { error: "This verse can't be found." };
  revalidatePath("/verses");
  revalidatePath(`/verses/${parsedId.data}`);
  return {};
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
  if (await guestIsFull(user)) return { ok: false, error: GUEST_FULL };

  const result = await resolveVerse({ reference, translation, text: "", notes: "", tags: "" });
  if (!result.ok) return { ok: false, error: Object.values(result.errors)[0] ?? "That verse can't be kept." };

  const [created] = await db
    .insert(verses)
    .values({ ...result.verse, notes: null, userId: user.id })
    .returning({ id: verses.id, reference: verses.reference });
  revalidatePath("/", "layout");
  return { ok: true, ...created };
}

// Saves the user's own order of My verses: the ids, first to last.
export async function saveVerseOrder(ids: string[]): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = z.array(z.uuid()).max(2000).safeParse(ids);
  if (!parsed.success || new Set(parsed.data).size !== parsed.data.length) return { error: "That order can't be saved." };

  await db.execute(sql`
    update ${verses} set position = o.pos - 1
    from unnest(array[${sql.join(
      parsed.data.map((id) => sql`${id}`),
      sql`, `,
    )}]::uuid[]) with ordinality as o(id, pos)
    where ${verses.id} = o.id and ${verses.userId} = ${user.id}`);
  revalidatePath("/verses");
  return {};
}
