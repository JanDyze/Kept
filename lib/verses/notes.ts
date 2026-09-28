import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { verseNotes, verses } from "@/lib/db/schema";
import { noteWhen } from "./note-when";

export { noteWhen };

// A verse's notes thread. Every query is scoped by userId (RLS doesn't cover the app's connection).

export const MAX_NOTE = 2000;

export type NoteView = { id: string; body: string; when: string };

export async function listNotes(userId: string, verseId: string, timeZone: string): Promise<NoteView[]> {
  const rows = await db
    .select({ id: verseNotes.id, body: verseNotes.body, createdAt: verseNotes.createdAt })
    .from(verseNotes)
    .where(and(eq(verseNotes.userId, userId), eq(verseNotes.verseId, verseId)))
    .orderBy(asc(verseNotes.createdAt));
  return rows.map((r) => ({ id: r.id, body: r.body, when: noteWhen(r.createdAt, timeZone) }));
}

export async function insertNote(userId: string, verseId: string, body: string) {
  const [verse] = await db
    .select({ id: verses.id })
    .from(verses)
    .where(and(eq(verses.id, verseId), eq(verses.userId, userId)))
    .limit(1);
  if (!verse) return null;
  const [note] = await db
    .insert(verseNotes)
    .values({ verseId, userId, body })
    .returning({ id: verseNotes.id, body: verseNotes.body, createdAt: verseNotes.createdAt });
  return note;
}

export async function removeNote(userId: string, noteId: string) {
  const deleted = await db
    .delete(verseNotes)
    .where(and(eq(verseNotes.id, noteId), eq(verseNotes.userId, userId)))
    .returning({ verseId: verseNotes.verseId });
  return deleted[0]?.verseId ?? null;
}
