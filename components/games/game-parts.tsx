"use client";

import Link from "next/link";
import { ChevronRight, Loader2, PartyPopper } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GameTitle({ name, detail }: { name: string; detail?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-brand text-3xl font-semibold tracking-tight">{name}</h1>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

// Saving indicator while a game's result is recorded, or the error if that failed.
export function GameError({ message, saving }: { message: string | null; saving?: boolean }) {
  if (saving)
    return (
      <p role="status" className="mt-4 inline-flex items-center gap-2 self-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Saving your result…
      </p>
    );
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-destructive">
      {message}
    </p>
  );
}

// Shown once a game ends: headline, result, the full verse(s), and where to go next.
export function GameOver({
  won,
  headline,
  result,
  verses,
  note,
  next,
}: {
  won: boolean;
  headline: string;
  result: string;
  verses: { reference: string; translation: string; text: string }[];
  note?: string;
  next?: { href: string; name: string };
}) {
  return (
    <section className="animate-rise mt-6 rounded-2xl border bg-card p-5" aria-live="polite">
      <div className="flex items-center gap-3">
        {won && <PartyPopper className="size-6 text-amber-500" aria-hidden />}
        <div>
          <h2 className="font-brand text-2xl font-semibold">{headline}</h2>
          <p className="text-sm text-muted-foreground">{result}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {verses.map((v) => (
          <figure key={v.reference}>
            <blockquote className="font-serif text-lg leading-relaxed">{v.text}</blockquote>
            <figcaption className="mt-1 text-sm font-medium">
              {v.reference} <span className="font-normal text-muted-foreground">· {v.translation}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {note && <p className="mt-4 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {next && (
          <Link
            href={next.href}
            transitionTypes={["nav-forward"]}
            className={cn(buttonVariants(), "h-11 gap-1 px-5 text-base")}
          >
            Next: {next.name} <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
        <Link
          href="/games"
          transitionTypes={["nav-back"]}
          className={cn(buttonVariants({ variant: next ? "ghost" : "default" }), "h-11 px-5 text-base")}
        >
          All games
        </Link>
      </div>
    </section>
  );
}

export function GiveUp({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (window.confirm("Give up and see the answer? This counts as today's result.")) onConfirm();
      }}
      className="mt-8 self-center py-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Give up
    </button>
  );
}
