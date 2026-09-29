"use client";

import { useSyncExternalStore } from "react";
import { CardSwiper } from "@/components/card-swiper";
import { verseNeighbours } from "@/lib/verse-order";

const noSubscription = () => () => {};

// A verse opened from My verses swipes to the verses either side, in the order the list showed.
// Opened from anywhere else (Home, a game), it stays put.
export function VerseSwiper({ id, children }: { id: string; children: React.ReactNode }) {
  const around = useSyncExternalStore(noSubscription, () => verseNeighbours(id), () => "");
  const [prev, next] = around.split("|");
  if (!around) return children;
  return (
    <CardSwiper key={id} prevHref={prev ? `/verses/${prev}` : null} nextHref={next ? `/verses/${next}` : null}>
      {children}
    </CardSwiper>
  );
}
