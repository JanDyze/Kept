"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { markTour, seenTours, TOURS, type TourId, type TourStep } from "@/lib/tours";
import { cn } from "@/lib/utils";

// Put <Tour id="…" /> on a page to walk a first-time visitor through its non-obvious parts
// (lib/tours.ts): the page dims around one element at a time with a short note beside it. Skip,
// Next and Got it; either way it's marked seen on this device. `?tour=<id>` (from Settings → Tips)
// starts it again.
const PAD = 8; // space around the spotlit element
const GAP = 12; // between the spotlight and the note
const START_DELAY = 700; // let the page slide in (and any sheet open) first

const find = (step: TourStep) => document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);

export function Tour({ id }: { id: TourId }) {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const forced = new URLSearchParams(location.search).get("tour") === id;
    if (!forced && seenTours().has(id)) return;
    let timer = 0;
    const begin = () => {
      // Another tour or a sheet (What's new) is up: wait for it.
      if (document.querySelector("[data-tour-open], [role='dialog']")) {
        timer = window.setTimeout(begin, 800);
        return;
      }
      const shown = TOURS[id].steps.filter((s) => find(s));
      if (shown.length) setSteps(shown);
    };
    timer = window.setTimeout(begin, START_DELAY);
    return () => clearTimeout(timer);
  }, [id]);

  const step = steps?.[i];

  // Bring the spotlit element into view, then follow it as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!step) return;
    const el = find(step);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 72 || Math.min(r.bottom, r.top + innerHeight * 0.4) > innerHeight - 200) {
      // Tall ones scroll to their top, others to the middle.
      el.scrollIntoView({ block: r.height > innerHeight * 0.4 ? "start" : "center", behavior: "smooth" });
    }
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    };
    measure();
    addEventListener("scroll", measure, true);
    addEventListener("resize", measure);
    const settle = setTimeout(measure, 400);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      removeEventListener("scroll", measure, true);
      removeEventListener("resize", measure);
    };
  }, [step]);

  const end = useCallback(() => {
    markTour(id, true);
    setSteps(null);
    // Drop ?tour= so a reload doesn't start it again.
    const url = new URL(location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      history.replaceState(history.state, "", url);
    }
  }, [id]);

  useEffect(() => {
    if (!steps) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [steps, end]);

  if (!steps || !step || !rect) return null;
  const last = i === steps.length - 1;

  // The note goes under the spotlight when there's room, else over it; kept inside the screen.
  // A tall element (a list, a chapter) is lit only at its top, leaving room for the note.
  const height = Math.min(rect.height, innerHeight * 0.4);
  const hole = { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: height + PAD * 2 };
  const below = hole.top + hole.height + GAP + 180 < innerHeight || hole.top < 200;
  const width = Math.min(320, innerWidth - 32);
  const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), innerWidth - width - 16);
  const top = below ? Math.min(hole.top + hole.height + GAP, innerHeight - 180) : undefined;
  const bottom = below ? undefined : Math.max(innerHeight - hole.top + GAP, 16);

  return createPortal(
    <div data-tour-open className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* Dims everything but the spotlit element; taps outside the note do nothing. */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-2xl transition-[top,left,width,height] duration-300 ease-out"
        style={{ ...hole, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
      />
      <div
        key={i}
        className="animate-rise fixed rounded-2xl bg-popover p-4 text-popover-foreground shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45)]"
        style={{ left, width, top, bottom }}
      >
        <p id="tour-title" className="font-brand text-lg font-semibold tracking-tight">
          {step.title}
        </p>
        <p id="tour-body" className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {steps.length > 1 && (
            <span className="flex gap-1" aria-label={`Step ${i + 1} of ${steps.length}`}>
              {steps.map((_, n) => (
                <span key={n} className={cn("size-1.5 rounded-full", n === i ? "bg-primary" : "bg-muted-foreground/30")} />
              ))}
            </span>
          )}
          {!last && (
            <button type="button" onClick={end} className="ml-auto h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Skip
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => (last ? end() : setI(i + 1))}
            className={cn(
              "h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
              last && "ml-auto",
            )}
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
