"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpenText, Check, ChevronRight, Loader2, PartyPopper, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReplay } from "./replay";

// Which round is showing ("Verse 2 of 3"); the game's name is in the top bar.
export function GameDetail({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mb-3 text-sm text-muted-foreground">{text}</p>;
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

export function GiveUp({ onConfirm, disabled, className }: { onConfirm: () => void; disabled?: boolean; className?: string }) {
  const practice = useReplay()?.practice;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const question = practice ? "Give up and see the answer?" : "Give up and see the answer? This counts as today's result.";
        if (window.confirm(question)) onConfirm();
      }}
      className={cn(
        "mt-8 self-center py-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40",
        className,
      )}
    >
      Give up
    </button>
  );
}

// The end of a game, in place of the board: a headline, the game's own summary, and a bottom bar
// with where to go next. Scrolls to the top so it's seen whole, not found below the board.
export function GameResult({
  won,
  headline,
  result,
  next,
  children,
}: {
  won: boolean;
  headline: string;
  result: string;
  next?: { href: string; name: string };
  children?: React.ReactNode;
}) {
  const replay = useReplay();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const Icon = won ? PartyPopper : BookOpenText;

  return (
    <section className="flex flex-1 flex-col" aria-live="polite">
      <div className="animate-rise flex flex-col items-center pt-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-icon-tile">
          <Icon className={cn("size-8", won ? "text-icon-accent" : "text-icon-ink")} aria-hidden />
        </span>
        <h2 className="mt-4 font-brand text-3xl font-semibold tracking-tight">{headline}</h2>
        <p className="mt-1 text-muted-foreground">{result}</p>
      </div>

      {children && (
        <div className="animate-rise mt-7" style={{ animationDelay: "80ms" }}>
          {children}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 bg-background/90 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        {next && (
          <Link href={next.href} transitionTypes={["nav-forward"]} className={cn(buttonVariants(), "h-12 gap-1 text-base")}>
            Next: {next.name} <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
        <div className={cn("grid gap-2", replay && "grid-cols-2")}>
          {replay && (
            <button
              type="button"
              onClick={replay.replay}
              className={cn(buttonVariants({ variant: "outline" }), "h-12 gap-1.5 text-base")}
            >
              <RotateCcw className="size-4" aria-hidden /> Play again
            </button>
          )}
          <Link
            href="/games"
            transitionTypes={["nav-back"]}
            className={cn(buttonVariants({ variant: next ? "outline" : "default" }), "h-12 text-base")}
          >
            All games
          </Link>
        </div>
      </div>
    </section>
  );
}

// A play screen that fills exactly the space you can see: from where it starts down to the bottom
// of the visual viewport, which shrinks when the phone keyboard opens. With the verse scrolling
// inside it and the controls at its foot, the keyboard can't push the verse out of sight.
// `onResize` runs after each change, e.g. to bring the word being typed back into view.
export function KeyboardFit({
  children,
  className,
  onResize,
}: {
  children: React.ReactNode;
  className?: string;
  onResize?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    onResizeRef.current = onResize;
  });
  useLayoutEffect(() => {
    const el = ref.current!;
    const vv = window.visualViewport;
    const fit = () => {
      const top = el.getBoundingClientRect().top - (vv?.offsetTop ?? 0);
      const visible = (vv?.height ?? window.innerHeight) - Math.max(0, top);
      const height = `${Math.max(280, Math.round(visible))}px`;
      if (el.style.height === height) return;
      el.style.height = height;
      onResizeRef.current?.();
    };
    fit();
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);
    window.addEventListener("resize", fit);
    return () => {
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
    };
  }, []);
  return (
    <div ref={ref} className={cn("flex min-h-0 flex-col", className)}>
      {children}
    </div>
  );
}

export const countText = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const mistakesText = (n: number) => (n === 0 ? "No mistakes" : countText(n, "mistake"));

// The verse being played, on its own card.
export function VerseCard({
  reference,
  translation,
  children,
  className,
  aside,
}: {
  reference?: string;
  translation?: string;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}) {
  return (
    <figure className={cn("relative rounded-2xl border bg-card p-5", className)}>
      {reference && (
        <figcaption className="pr-8 text-sm font-medium text-muted-foreground">
          {reference}
          {translation && ` · ${translation}`}
        </figcaption>
      )}
      <div className={cn("font-serif text-xl leading-loose", reference && "mt-2")}>{children}</div>
      {aside}
    </figure>
  );
}

// Progress as one bar per part (a verse, a round), each filling 0–1.
export function Segments({ parts, className }: { parts: number[]; className?: string }) {
  return (
    <div className={cn("flex gap-1.5", className)} aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(1, p)) * 100}%` }}
          />
        </span>
      ))}
    </div>
  );
}

// The sticky bottom bar a game is played from: a status line, the controls, and Give up.
export function ActionBar({
  left,
  right,
  children,
  onGiveUp,
  disabled,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  onGiveUp?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto border-t bg-background/90 px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      {(left || right) && (
        <p className="mb-2.5 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{left}</span>
          <span>{right}</span>
        </p>
      )}
      {children}
      {onGiveUp && <GiveUp className="mt-1 w-full" disabled={disabled} onConfirm={onGiveUp} />}
    </div>
  );
}

// The finished board stays up a beat before the result replaces it (not after giving up, and not
// when the page opens on a game already done).
export function useResultShown(playing: boolean, instant?: boolean, pause = 900) {
  const [shown, setShown] = useState(!playing);
  useEffect(() => {
    if (playing || shown) return;
    const t = setTimeout(() => setShown(true), instant ? 0 : pause);
    return () => clearTimeout(t);
  }, [playing, shown, instant, pause]);
  return shown;
}

// Marks a finished verse or round, in the corner of its card.
export function DoneBadge({ label = "Done" }: { label?: string }) {
  return (
    <span className="animate-pop absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-4" strokeWidth={3} aria-label={label} />
    </span>
  );
}
