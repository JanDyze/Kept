"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getTimeZone } from "@/lib/day";
import { insertNote, MAX_NOTE, noteWhen, removeNote, type NoteView } from "@/lib/verses/notes";

const id = z.uuid();

export async function addNote(verseId: string, body: string): Promise<{ note: NoteView } | { error: string }> {
  const user = await requireUser();
  const text = body.trim();
  if (!id.safeParse(verseId).success) return { error: "This verse can't be found." };
  if (!text) return { error: "Write something first." };
  if (text.length > MAX_NOTE) return { error: "A note can be up to 2,000 characters." };

  const note = await insertNote(user.id, verseId, text);
  if (!note) return { error: "This verse can't be found." };
  revalidatePath(`/verses/${verseId}`);
  return { note: { id: note.id, body: note.body, when: noteWhen(note.createdAt, await getTimeZone()) } };
}

export async function deleteNote(noteId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!id.safeParse(noteId).success) return { error: "That note can't be found." };
  const verseId = await removeNote(user.id, noteId);
  if (!verseId) return { error: "That note can't be found." };
  revalidatePath(`/verses/${verseId}`);
  return {};
}
