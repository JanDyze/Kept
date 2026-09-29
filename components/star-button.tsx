"use client";

import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Star something to keep it at the top of its list (a verse in My verses, a game in Games).
// Flips at once; the save follows. `action` is a server action bound to what's being starred.
export function StarButton({ starred, action }: { starred: boolean; action: (starred: boolean) => Promise<unknown> }) {
  const [shown, setShown] = useOptimistic(starred);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={shown ? "Starred" : "Star"}
      onClick={() =>
        start(async () => {
          setShown(!shown);
          await action(!shown);
        })
      }
      className={cn(
        "flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-muted",
        shown ? "text-icon-accent" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Star className={cn("size-5 transition-transform active:scale-90", shown && "fill-current")} aria-hidden />
    </button>
  );
}
