"use client";

import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { setStarred } from "@/app/verses/actions";
import { cn } from "@/lib/utils";

// Star a verse to keep it at the top of My verses. Flips at once; the save follows.
export function StarButton({ verseId, starred }: { verseId: string; starred: boolean }) {
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
          await setStarred(verseId, !shown);
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
