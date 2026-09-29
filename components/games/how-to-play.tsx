"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, RotateCcw } from "lucide-react";
import { GameIcon } from "@/components/game-icons";
import type { GameInfo } from "@/lib/games/registry";

const SEEN_KEY = (id: string) => `kept:how-to-play:${id}`;

// The top-bar "?" for a game: a sheet with its rules. Opens by itself the first time a game is
// opened on this device, so nobody starts a game without knowing how it works.
export function HowToPlay({
  info,
}: {
  info: Pick<GameInfo, "id" | "name" | "blurb" | "rules" | "recall">;
}) {
  const [open, setOpen] = useState(false);

  // After the page has slid in.
  useEffect(() => {
    let unseen = false;
    try {
      unseen = !localStorage.getItem(SEEN_KEY(info.id));
    } catch {}
    if (!unseen) return;
    const timer = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(timer);
  }, [info.id]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY(info.id), "1");
    } catch {}
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How to play"
        className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <CircleHelp className="size-5" aria-hidden />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-play-title"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="animate-fade-in absolute inset-0 bg-black/40"
            />
            <div className="animate-rise relative mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl border bg-background shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)] sm:rounded-3xl">
              <div className="flex items-center gap-3.5 px-5 pt-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-[26%] bg-icon-tile">
                  <GameIcon game={info.id} className="size-[66%]" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    How to play
                  </p>
                  <h2
                    id="how-to-play-title"
                    className="truncate font-brand text-xl font-semibold tracking-tight"
                  >
                    {info.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{info.blurb}</p>
                </div>
              </div>

              <div className="mt-5 overflow-y-auto overscroll-contain px-5">
                <ol className="flex flex-col gap-3">
                  {info.rules.map((rule, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 leading-snug">{rule}</span>
                    </li>
                  ))}
                </ol>
                <ul className="mt-5 flex flex-col gap-2 rounded-2xl bg-muted/60 p-3.5 text-sm text-muted-foreground">
                  {info.recall && (
                    <li>
                      <span className="font-medium text-foreground">
                        Counts as a review.
                      </span>{" "}
                      How well you do sets when each verse comes back next.
                    </li>
                  )}
                  <li className="flex gap-1.5">
                    <RotateCcw
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden
                    />
                    <span>
                      A new puzzle every day from your verses. Give up any time
                      to see the answer; once it&apos;s done you can play again
                      for practice.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/85"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
