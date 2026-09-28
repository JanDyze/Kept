"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Loader2, Palette, X } from "lucide-react";
import { keepVerse } from "@/app/verses/actions";
import { cn } from "@/lib/utils";

// Keeps a verse in one tap, then offers to make it a card. The notice is announced with an event
// so a page shows one at a time, from whichever button was tapped last.
const KEPT_EVENT = "kept-verse";
type Kept = { id: string; reference: string };

export function KeepButton({ reference, translation }: { reference: string; translation: string }) {
  const [kept, setKept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (kept)
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground">
        <Check className="size-4" aria-hidden /> Kept
      </span>
    );

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await keepVerse(reference, translation);
            if (!result.ok) return setError(result.error);
            setKept(true);
            window.dispatchEvent(new CustomEvent<Kept>(KEPT_EVENT, { detail: { id: result.id, reference: result.reference } }));
          })
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85 disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />} Keep
      </button>
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </>
  );
}

const SHOW_FOR = 7000;

// The floating "Kept · Customize" notice. Place once on a page that has KeepButtons.
export function KeptNotice() {
  const [kept, setKept] = useState<Kept | null>(null);

  useEffect(() => {
    const onKept = (e: Event) => setKept((e as CustomEvent<Kept>).detail);
    window.addEventListener(KEPT_EVENT, onKept);
    return () => window.removeEventListener(KEPT_EVENT, onKept);
  }, []);

  useEffect(() => {
    if (!kept) return;
    const timer = setTimeout(() => setKept(null), SHOW_FOR);
    return () => clearTimeout(timer);
  }, [kept]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {kept && (
        <div
          key={kept.id}
          role="status"
          className={cn(
            "animate-rise pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground py-2 pr-2 pl-4 text-background",
            "shadow-[0_12px_32px_-12px_rgb(0_0_0/0.45)]",
          )}
        >
          <Check className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm">
            Kept <span className="font-semibold">{kept.reference}</span>
          </span>
          <Link
            href={`/verses/${kept.id}/card`}
            transitionTypes={["nav-forward"]}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-background/15 px-3 text-sm font-medium hover:bg-background/25"
          >
            <Palette className="size-4" aria-hidden /> Customize
          </Link>
          <button
            type="button"
            onClick={() => setKept(null)}
            aria-label="Dismiss"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-background/70 hover:bg-background/15 hover:text-background"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
