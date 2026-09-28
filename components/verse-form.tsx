"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { lookupPassage, saveVerse, type VerseFormState } from "@/app/verses/actions";
import { TagChip } from "@/components/tag-chip";
import { tagLabel } from "@/lib/verses/tag-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatReference, parseReference } from "@/lib/bible/books";
import { isLookupTranslation, LOOKUP_TRANSLATIONS } from "@/lib/bible/translations";
import { normalizeTags } from "@/lib/verses/tags";
import { cn } from "@/lib/utils";

export type VerseFormValues = {
  id?: string;
  reference: string;
  translation: string;
  text: string;
  notes: string;
  tags: string[];
};

// Preview of ESV / MBBTAG text for a given reference + translation ("key").
type Preview =
  | { state: "idle" }
  | { state: "loading"; key: string }
  | { state: "filled"; key: string; text: string; note: string | null }
  | { state: "error"; key: string; message: string };

const OTHER = "other";
const label = "text-sm font-medium text-muted-foreground";

// Add or edit a verse: the reference and translation up top, the verse itself as it will be kept,
// tags (and, for a new verse, a first note) folded away until wanted, and Save in a sticky bar. Nothing is focused on open, so
// the keyboard stays down until a field is tapped.
export function VerseForm({
  initial,
  allTags,
  lastTranslation,
}: {
  initial?: VerseFormValues;
  allTags: string[];
  lastTranslation?: string;
}) {
  const [state, action, pending] = useActionState<VerseFormState, FormData>(saveVerse, {});
  const editing = Boolean(initial?.id);

  const startTranslation = initial?.translation ?? lastTranslation ?? "ESV";
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [choice, setChoice] = useState(isLookupTranslation(startTranslation) ? startTranslation : OTHER);
  const [otherName, setOtherName] = useState(isLookupTranslation(startTranslation) ? "" : startTranslation);
  // Only "Other" translations have typed text. ESV / MBBTAG text is locked to the imported copy.
  const [text, setText] = useState(initial && !isLookupTranslation(initial.translation) ? initial.text : "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [draftTag, setDraftTag] = useState("");
  // Controlled so React's post-action form reset can't wipe it when validation fails.
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [extrasOpen, setExtrasOpen] = useState(Boolean(initial?.tags.length));
  const [refTouched, setRefTouched] = useState(false);
  const [preview, setPreview] = useState<Preview>(
    initial?.text && isLookupTranslation(initial.translation)
      ? { state: "filled", key: `${initial.reference}|${initial.translation}`, text: initial.text, note: null }
      : { state: "idle" },
  );

  const translation = choice === OTHER ? otherName.trim() : choice;
  const locked = isLookupTranslation(translation);
  const parsed = useMemo(() => (reference.trim() ? parseReference(reference) : null), [reference]);
  const canonical = parsed?.ok
    ? formatReference(parsed.ref.book.name, parsed.ref.chapter, parsed.ref.verseStart, parsed.ref.verseEnd)
    : null;
  const previewKey = canonical && locked ? `${canonical}|${translation}` : null;
  const shown = previewKey && preview.state !== "idle" && preview.key === previewKey ? preview : null;

  const request = useRef(0);
  useEffect(() => {
    if (!previewKey || !canonical || !isLookupTranslation(translation)) return;
    if (preview.state !== "idle" && preview.key === previewKey) return;
    const id = ++request.current;
    const timer = setTimeout(async () => {
      setPreview({ state: "loading", key: previewKey });
      const result = await lookupPassage(canonical, translation);
      if (id !== request.current) return; // a newer lookup superseded this one
      setPreview(
        result.ok
          ? { state: "filled", key: previewKey, text: result.text, note: result.note }
          : { state: "error", key: previewKey, message: result.error },
      );
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const addTag = (raw: string) => {
    const next = normalizeTags([...tags, ...raw.split(",")]);
    setTags(next);
    setDraftTag("");
  };
  const suggestions = allTags.filter((t) => !tags.includes(t)).slice(0, 12);
  const errors = state.errors ?? {};
  const refError = errors.reference ?? (refTouched && parsed && !parsed.ok ? parsed.error : undefined);
  const ready = Boolean(canonical) && (locked ? shown?.state === "filled" : Boolean(translation && text.trim()));
  const extrasCount = tags.length + (notes.trim() ? 1 : 0);

  return (
    <form action={action} className="flex flex-1 flex-col">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="translation" value={translation} />
      <input type="hidden" name="tags" value={normalizeTags([...tags, draftTag]).join(", ")} />

      <div className="flex flex-col gap-2">
        <label htmlFor="reference" className={label}>
          Reference
        </label>
        <div className="relative">
          <Input
            id="reference"
            name="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            onBlur={() => setRefTouched(true)}
            placeholder="John 3:16"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            aria-invalid={Boolean(refError)}
            aria-describedby={refError || canonical ? "reference-status" : undefined}
            className="h-14 rounded-xl bg-card pr-12 pl-4 font-brand text-xl font-semibold tracking-tight placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal md:text-xl"
          />
          {canonical && (
            <Check className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-primary" aria-hidden />
          )}
        </div>
        {refError ? (
          <p id="reference-status" className="text-sm text-destructive">
            {refError}
          </p>
        ) : (
          canonical &&
          canonical !== reference.trim() && (
            <p id="reference-status" className="text-sm text-muted-foreground">
              {canonical}
            </p>
          )
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <span id="translation-label" className={label}>
          Translation
        </span>
        <div role="radiogroup" aria-labelledby="translation-label" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {[...LOOKUP_TRANSLATIONS, OTHER].map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={choice === t}
              onClick={() => setChoice(t)}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                choice === t
                  ? "bg-background text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === OTHER ? "Other" : t}
            </button>
          ))}
        </div>
        {choice === OTHER && (
          <Input
            aria-label="Translation name"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            placeholder="NIV, ADB…"
            autoCapitalize="characters"
            className="h-11 rounded-xl bg-card px-4 text-base"
          />
        )}
        {errors.translation && <p className="text-sm text-destructive">{errors.translation}</p>}
      </div>

      {/* The verse as it will be kept */}
      {locked ? (
        shown && (
          <figure aria-live="polite" className="animate-rise mt-6 rounded-2xl border bg-card p-5">
            <figcaption className="text-sm font-medium text-muted-foreground">
              {canonical} · {translation}
            </figcaption>
            {shown.state === "filled" ? (
              <p className="mt-2 whitespace-pre-line font-serif text-xl leading-relaxed">{shown.text}</p>
            ) : shown.state === "loading" ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Looking it up…
              </p>
            ) : (
              <p className="mt-2 text-sm text-destructive">{shown.message}</p>
            )}
            {shown.state === "filled" && shown.note && <p className="mt-3 text-sm text-muted-foreground">{shown.note}</p>}
          </figure>
        )
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="text" className={label}>
            Verse
          </label>
          <Textarea
            id="text"
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Paste the verse"
            aria-invalid={Boolean(errors.text)}
            className="min-h-36 rounded-2xl bg-card p-5 font-serif text-xl leading-relaxed md:text-xl"
          />
          {errors.text && <p className="text-sm text-destructive">{errors.text}</p>}
        </div>
      )}

      {/* Tags (and a first note), folded away until wanted */}
      <div className="mt-6 rounded-2xl border bg-card">
        <button
          type="button"
          aria-expanded={extrasOpen}
          aria-controls="verse-extras"
          onClick={() => setExtrasOpen((o) => !o)}
          className="flex h-13 w-full items-center gap-3 rounded-2xl px-4 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex-1 font-medium">{editing ? "Tags" : "Tags and a note"}</span>
          {!extrasOpen && extrasCount > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {extrasCount}
            </span>
          )}
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform duration-200", extrasOpen && "rotate-180")}
            aria-hidden
          />
        </button>

        <div id="verse-extras" hidden={!extrasOpen} className="border-t px-4 pt-4 pb-5">
          <label htmlFor="tag-input" className={label}>
            Tags
          </label>
          <div className="mt-2 flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            {tags.map((t) => (
              <TagChip key={t} tag={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />
            ))}
            <input
              id="tag-input"
              value={draftTag}
              onChange={(e) => (e.target.value.includes(",") ? addTag(e.target.value) : setDraftTag(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (draftTag.trim()) addTag(draftTag);
                } else if (e.key === "Backspace" && !draftTag && tags.length) {
                  setTags(tags.slice(0, -1));
                }
              }}
              onBlur={() => draftTag.trim() && addTag(draftTag)}
              placeholder={tags.length ? "" : "Faith, peace…"}
              autoComplete="off"
              autoCapitalize="none"
              enterKeyHint="enter"
              className="h-8 min-w-24 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {suggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-dashed border-input pr-2.5 pl-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="size-3.5" aria-hidden /> {tagLabel(t)}
                </button>
              ))}
            </div>
          )}
          {errors.tags && <p className="mt-2 text-sm text-destructive">{errors.tags}</p>}

          {/* A new verse can start its notes thread here; after that, notes live on the verse page. */}
          {!editing && (
            <>
              <label htmlFor="notes" className={cn(label, "mt-5 block")}>
                Note
              </label>
              <Textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Why this verse"
                aria-invalid={Boolean(errors.notes)}
                className="mt-2 rounded-xl px-3 py-2.5 text-base md:text-base"
              />
              {errors.notes && <p className="mt-2 text-sm text-destructive">{errors.notes}</p>}
            </>
          )}
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-auto bg-background/90 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <Button type="submit" disabled={pending || !ready} aria-busy={pending} className="h-12 w-full gap-2 text-base">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {editing ? "Save changes" : "Save verse"}
        </Button>
      </div>
    </form>
  );
}
