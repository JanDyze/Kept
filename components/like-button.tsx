"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { likeCard, likeVerse } from "@/app/cards/actions";
import { cn } from "@/lib/utils";

type Target = { card: string } | { verse: { bookNumber: number; chapter: number; verseStart: number } };

// A heart with its count, for a shared card or a passage in Discover. Flips at once; the save
// follows. `size="sm"` sits under a gallery tile.
export function LikeButton({
  target,
  likes,
  liked,
  size = "md",
  className,
}: {
  target: Target;
  likes: number;
  liked: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  // Local state, not a refresh: the list stays where it is (a like would re-rank it under your
  // finger); the new order shows next time the list opens.
  const [state, setState] = useState({ likes, liked });
  const toggle = () => {
    const was = state;
    const next = !state.liked;
    setState({ liked: next, likes: Math.max(0, state.likes + (next ? 1 : -1)) });
    ("card" in target ? likeCard(target.card, next) : likeVerse(target.verse, next))
      .then((r) => r.error && setState(was))
      .catch(() => setState(was));
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={state.liked}
      aria-label={state.liked ? `Liked, ${state.likes}` : `Like${state.likes ? `, ${state.likes}` : ""}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full tabular-nums transition-colors",
        size === "sm" ? "h-7 px-1.5 text-xs" : "h-9 px-3 text-sm",
        state.liked ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Heart
        key={String(state.liked)}
        className={cn(size === "sm" ? "size-3.5" : "size-4", state.liked && "animate-pop fill-current")}
        aria-hidden
      />
      {state.likes > 0 && state.likes.toLocaleString()}
    </button>
  );
}
