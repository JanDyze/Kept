"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lightbulb } from "lucide-react";
import { askForTour, markTour, TOURS, type TourId } from "@/lib/tours";

// Settings → Tips: show any of the guided tours (lib/tours.ts) again. One with a page of its own
// opens it and starts; one on a detail page (a verse, a card) waits for the next one opened.
export function TipsSettings() {
  const router = useRouter();
  const [queued, setQueued] = useState<Set<TourId>>(() => new Set());
  const tours = Object.values(TOURS);

  const show = (id: TourId) => {
    markTour(id, false);
    askForTour(id, true);
    const href = TOURS[id].href;
    if (href) router.push(`${href}?tour=${id}`, { transitionTypes: ["nav-forward"] });
    else setQueued((q) => new Set(q).add(id));
  };

  return (
    <section aria-labelledby="tips" className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="tips" className="text-sm font-medium text-muted-foreground">
          Tips
        </h2>
        <button
          type="button"
          onClick={() => {
            tours.forEach((t) => {
              markTour(t.id, false);
              askForTour(t.id, true);
            });
            setQueued(new Set(tours.map((t) => t.id)));
          }}
          className="rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-muted"
        >
          Show all again
        </button>
      </div>
      <ul className="divide-y rounded-2xl border bg-card">
        {tours.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <Lightbulb className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{t.name}</span>
              <span className="block text-sm text-muted-foreground">
                {queued.has(t.id) ? "Shows again next time" : t.where}
              </span>
            </span>
            {queued.has(t.id) ? (
              <Check className="size-5 shrink-0 text-primary" aria-label="Will show again" />
            ) : (
              <button
                type="button"
                onClick={() => show(t.id)}
                className="h-9 shrink-0 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
              >
                Show
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
