"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Ban, BookmarkCheck, Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { findVerses, lookupPassage, saveVerse, type VerseFormState } from "@/app/verses/actions";
import { DEFAULT_TAGS } from "@/lib/verses/default-tags";
import { TagChip } from "@/components/tag-chip";
import { tagLabel } from "@/lib/verses/tag-label";
import { MemoryCard } from "@/components/memory-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatReference, parseReference } from "@/lib/bible/books";
import { CARD_COLORS, DEFAULT_CARD, type CardColor, type CardStyle } from "@/lib/cards/style";
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
  // Adding a verse can make it a card at once: a color here, the rest later in the card editor.
  const [cardColor, setCardColor] = useState<CardColor | null>(null);
  const [extrasOpen, setExtrasOpen] = useState(Boolean(initial?.tags.length));
  const [refTouched, setRefTouched] = useState(false);
  const [preview, setPreview] = useState<Preview>(
    initial?.text && isLookupTranslation(initial.translation)
      ? { state: "filled", key: `${initial.reference}|${initial.translation}`, text: initial.text, note: null }
      : { state: "idle" },
  );

  const translation = choice === OTHER ? otherName.trim() : choice;
  const cardStyle: CardStyle | null = cardColor ? { ...DEFAULT_CARD, bg: { kind: "color", color: cardColor } } : null;
  const locked = isLookupTranslation(translation);
  const parsed = useMemo(() => (reference.trim() ? parseReference(reference) : null), [reference]);
  const canonical = parsed?.ok
    ? formatReference(parsed.ref.book.name, parsed.ref.chapter, parsed.ref.verseStart, parsed.ref.verseEnd)
    : null;
  const previewKey = canonical && locked ? `${canonical}|${translation}` : null;
  const shown = previewKey && preview.state !== "idle" && preview.key === previewKey ? preview : null;

  // Typed a topic, a feeling or words instead of a reference (no digits, not a reference): verses
  // to pick from, as in Discover.
  const topicQuery = reference.trim().length >= 3 && !/\d/.test(reference) && !parsed?.ok ? reference.trim() : null;
  const [found, setFound] = useState<{ query: string; items: { reference: string; text: string; saved: boolean }[] } | null>(null);
  const findRequest = useRef(0);
  useEffect(() => {
    if (!topicQuery) return;
    const id = ++findRequest.current;
    const timer = setTimeout(async () => {
      const items = await findVerses(topicQuery, isLookupTranslation(translation) ? translation : "ESV").catch(() => []);
      if (id === findRequest.current) setFound({ query: topicQuery, items });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicQuery]);
  const results = topicQuery && found?.query === topicQuery ? found.items : null;
  const pick = (ref: string) => {
    setReference(ref);
    setRefTouched(false);
    setFound(null);
  };

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
  // Your own tags first, then the usual ones.
  const suggestions = [...new Set([...allTags, ...DEFAULT_TAGS])].filter((t) => !tags.includes(t)).slice(0, 16);
  const errors = state.errors ?? {};
  const refError = errors.reference ?? (refTouched && parsed && !parsed.ok && !topicQuery ? parsed.error : undefined);
  const ready = Boolean(canonical) && (locked ? shown?.state === "filled" : Boolean(translation && text.trim()));
  const extrasCount = tags.length + (notes.trim() ? 1 : 0);

  return (
    <form action={action} className="flex flex-1 flex-col">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="translation" value={translation} />
      <input type="hidden" name="tags" value={normalizeTags([...tags, draftTag]).join(", ")} />
      {cardStyle && <input type="hidden" name="card" value={JSON.stringify(cardStyle)} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="reference" className={label}>
          Reference, topic or words
        </label>
        <div className="relative">
          <Input
            id="reference"
            name="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            onBlur={() => setRefTouched(true)}
            placeholder="John 3:16, or peace"
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
        {!reference.trim() && (
          <p className="text-sm text-muted-foreground">
            Type a reference, or a topic, a feeling or words you remember (like <em>anxiety</em> or <em>new job</em>) to find one.
          </p>
        )}
        {topicQuery && (
          <div aria-live="polite" className="animate-rise mt-1">
            {!results ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Finding verses about “{topicQuery}”…
              </p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No verses found for “{topicQuery}”. Try a simpler word, or a reference like John 3:16.
              </p>
            ) : (
              <ul className="flex flex-col gap-2" aria-label={`Verses about ${topicQuery}`}>
                {results.map((v) => (
                  <li key={v.reference}>
                    <button
                      type="button"
                      disabled={v.saved}
                      onClick={() => pick(v.reference)}
                      className="flex w-full flex-col gap-1 rounded-2xl border bg-card p-3.5 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Search className="size-3.5 text-muted-foreground" aria-hidden />
                        <span className="flex-1">{v.reference}</span>
                        {v.saved && (
                          <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                            <BookmarkCheck className="size-3.5" aria-hidden /> Kept
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 font-serif text-[0.95rem] leading-relaxed text-foreground/85">{v.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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

      {!editing && (
        <div className="mt-6 flex flex-col gap-2">
          <span id="card-label" className={label}>
            Card
          </span>
          <div role="radiogroup" aria-labelledby="card-label" className="flex flex-wrap gap-2.5">
            <button
              type="button"
              role="radio"
              aria-checked={cardColor === null}
              aria-label="No card"
              title="No card"
              onClick={() => setCardColor(null)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground ring-offset-2 ring-offset-background",
                cardColor === null && "ring-2 ring-primary",
              )}
            >
              <Ban className="size-4" aria-hidden />
            </button>
            {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cardColor === c}
                aria-label={CARD_COLORS[c].name}
                title={CARD_COLORS[c].name}
                onClick={() => setCardColor(c)}
                style={{ backgroundColor: CARD_COLORS[c].bg, color: CARD_COLORS[c].fg }}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.3)] ring-offset-2 ring-offset-background",
                  cardColor === c && "ring-2 ring-primary",
                )}
              >
                {cardColor === c && <Check className="size-4" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The verse as it will be kept: as its card when a color is picked */}
      {locked ? (
        cardStyle && shown?.state === "filled" ? (
          <MemoryCard
            style={cardStyle}
            reference={canonical ?? reference}
            translation={translation}
            text={shown.text}
            className="animate-rise mx-auto mt-6 max-w-[17rem]"
          />
        ) : (
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
          {cardStyle && text.trim() && (
            <MemoryCard
              style={cardStyle}
              reference={canonical ?? reference}
              translation={translation || "—"}
              text={text.trim()}
              className="animate-rise mx-auto mt-4 w-full max-w-[17rem]"
            />
          )}
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
