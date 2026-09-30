"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, Loader2, NotebookPen } from "lucide-react";
import { addNote, deleteNote } from "@/app/verses/[id]/notes-actions";
import type { NoteView } from "@/lib/verses/notes";
import { cn } from "@/lib/utils";

type Note = NoteView & { sending?: boolean };

const OPEN_EVENT = "kept:add-note";

// The "Note" button in the verse page's action row: opens the composer below.
export function AddNoteButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className={className}>
      <NotebookPen className="size-5" aria-hidden /> Note
    </button>
  );
}

// A verse's notes as a thread: what it meant on a given day, added over time, newest at the foot.
// The composer stays out of sight until asked for (AddNoteButton); new notes show at once and
// settle when saved.
export function VerseNotes({ verseId, initial, readOnly }: { verseId: string; initial: NoteView[]; readOnly?: boolean }) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const open = () => {
      setComposing(true);
      // The user asked for it, so the keyboard coming up is expected.
      requestAnimationFrame(() => {
        field.current?.focus();
        field.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (notes.length === 0 && (readOnly || !composing)) return null;

  function send() {
    const body = draft.trim();
    if (!body) return;
    const temp: Note = { id: `sending-${Date.now()}`, body, when: "Now", sending: true };
    setNotes((list) => [...list, temp]);
    setDraft("");
    setError(null);
    startTransition(async () => {
      const result = await addNote(verseId, body);
      if ("error" in result) {
        setNotes((list) => list.filter((n) => n.id !== temp.id));
        setDraft(body);
        setError(result.error);
      } else {
        setNotes((list) => list.map((n) => (n.id === temp.id ? result.note : n)));
      }
    });
  }

  function remove(note: Note) {
    if (!window.confirm("Delete this note?")) return;
    const at = notes.indexOf(note);
    setNotes((list) => list.filter((n) => n.id !== note.id));
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.error) {
        setNotes((list) => [...list.slice(0, at), note, ...list.slice(at)]);
        setError(result.error);
      }
    });
  }

  return (
    <section aria-labelledby="notes-heading" className="mt-9">
      <h2 id="notes-heading" className="flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
        Notes
        {notes.length > 0 && <span className="text-xs tabular-nums">{notes.length}</span>}
      </h2>

      {notes.length > 0 && (
        <ol className="relative mt-3 flex flex-col gap-4 border-l border-border pl-5">
          {notes.map((n) => (
            <li key={n.id} className={cn("animate-rise relative", n.sending && "opacity-60")}>
              <span className="absolute top-3.5 -left-[1.53rem] size-2 rounded-full bg-primary/50 ring-4 ring-background" aria-hidden />
              <p className="w-fit max-w-full whitespace-pre-line rounded-2xl rounded-tl-md bg-muted/70 px-4 py-2.5 leading-relaxed break-words">
                {n.body}
              </p>
              <p className="mt-1 flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                <span>{n.sending ? "Saving…" : n.when}</span>
                {!readOnly && !n.sending && (
                  <>
                    <span aria-hidden>·</span>
                    <button type="button" onClick={() => remove(n)} className="py-1 hover:text-destructive">
                      Delete
                    </button>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}

      {!readOnly && composing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mt-4 flex items-end gap-2 rounded-2xl border bg-card p-1.5 pl-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40"
        >
          <textarea
            ref={field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={notes.length ? "Add to the thread…" : "Add a note…"}
            aria-label="Add a note"
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-base leading-snug outline-none [field-sizing:content] placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Add note"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            {notes.some((n) => n.sending) ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
