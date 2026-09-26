"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import { lookupPassage, saveVerse, type VerseFormState } from "@/app/verses/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatReference, parseReference } from "@/lib/bible/books";
import { isLookupTranslation, LOOKUP_TRANSLATIONS } from "@/lib/bible/translations";
import { tagLabel } from "@/lib/verses/tag-label";
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
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  // Controlled so React's post-action form reset can't wipe it when validation fails.
  const [notes, setNotes] = useState(initial?.notes ?? "");
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

  const current = normalizeTags(tags);
  const suggestions = allTags.filter((t) => !current.includes(t)).slice(0, 12);
  const errors = state.errors ?? {};
  const refError = errors.reference ?? (refTouched && parsed && !parsed.ok ? parsed.error : undefined);

  return (
    <form action={action} className="flex flex-col gap-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="translation" value={translation} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="reference">Reference</Label>
        <Input
          id="reference"
          name="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          onBlur={() => setRefTouched(true)}
          placeholder="John 3:16, Rom 8:28-29, Juan 3:16"
          autoComplete="off"
          autoCapitalize="words"
          autoFocus={!editing}
          aria-invalid={Boolean(refError)}
          aria-describedby="reference-hint"
          className="h-11 text-base"
        />
        <p id="reference-hint" className={cn("min-h-5 text-sm", refError ? "text-destructive" : "text-muted-foreground")}>
          {refError ??
            (canonical ? (
              <span className="inline-flex items-center gap-1">
                <Check className="size-3.5" aria-hidden /> {canonical}
              </span>
            ) : (
              "Type a book, chapter and verse."
            ))}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Translation</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {[...LOOKUP_TRANSLATIONS, OTHER].map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={choice === t}
              onClick={() => setChoice(t)}
              className={cn(
                "h-11 rounded-lg border text-sm font-medium transition-colors",
                choice === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted",
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
            placeholder="e.g. NIV, ADB"
            className="h-11 text-base"
          />
        )}
        {errors.translation && <p className="text-sm text-destructive">{errors.translation}</p>}
      </fieldset>

      {locked ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium" id="text-label">
              Text
            </span>
            <Lock className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="text-xs text-muted-foreground">From your {translation} copy · can&apos;t be edited</span>
          </div>
          <div
            aria-labelledby="text-label"
            aria-live="polite"
            className={cn(
              "min-h-28 rounded-lg border bg-muted/40 px-3 py-2.5 font-serif text-lg leading-relaxed",
              !shown || shown.state !== "filled" ? "text-muted-foreground" : "",
            )}
          >
            {shown?.state === "filled" ? (
              shown.text
            ) : shown?.state === "loading" ? (
              <span className="inline-flex items-center gap-1.5 font-sans text-sm">
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Looking it up…
              </span>
            ) : (
              <span className="font-sans text-sm">The verse appears here once the reference is complete.</span>
            )}
          </div>
          {(shown?.state === "error" || (shown?.state === "filled" && shown.note)) && (
            <p className={cn("text-sm", shown.state === "error" ? "text-destructive" : "text-muted-foreground")}>
              {shown.state === "error" ? shown.message : shown.note}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="text">Text</Label>
          <Textarea
            id="text"
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Paste the verse text."
            aria-invalid={Boolean(errors.text)}
            className="min-h-32 font-serif text-lg leading-relaxed"
          />
          {errors.text && <p className="text-sm text-destructive">{errors.text}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="faith, peace, anxiety"
          autoComplete="off"
          autoCapitalize="none"
          className="h-11 text-base"
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags([...current, t].join(", "))}
                className="h-8 rounded-full border border-input px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                + {tagLabel(t)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Why this verse, context, cross-references"
          aria-invalid={Boolean(errors.notes)}
        />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? "Saving…" : editing ? "Save changes" : "Save verse"}
      </Button>
    </form>
  );
}
