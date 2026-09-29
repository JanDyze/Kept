"use client";

import { useSyncExternalStore } from "react";
import { CardSwiper } from "@/components/card-swiper";
import { verseNeighbours } from "@/lib/verse-order";

const noSubscription = () => () => {};

// A verse opened from My verses swipes (the whole page) to the verses either side, in the order the
// list showed. Opened from anywhere else (Home, a game), it stays put.
export function VerseSwiper({ id, children }: { id: string; children: React.ReactNode }) {
  const around = useSyncExternalStore(noSubscription, () => verseNeighbours(id), () => "");
  const [prev, next] = around.split("|");
  if (!around) return <div className="flex flex-1 flex-col">{children}</div>;
  return (
    <CardSwiper
      key={id}
      className="flex flex-1 flex-col"
      prevHref={prev ? `/verses/${prev}` : null}
      nextHref={next ? `/verses/${next}` : null}
    >
      {children}
    </CardSwiper>
  );
}
