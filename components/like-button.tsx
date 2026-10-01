"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { likeCard, likeVerse } from "@/app/cards/actions";
import { askGuestToSave } from "@/components/guest-prompt";
import { HoldReact } from "@/components/hold-react";
import { isReaction, REACTIONS, type Reaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";

type Target = { card: string } | { verse: { bookNumber: number; chapter: number; verseStart: number } };

// A card held to react (CardReact) tells its LikeButton, which saves it.
const CARD_REACT_EVENT = "kept-card-react";
// And the LikeButton tells the card what the viewer's reaction now is (a tap on the heart too).
const CARD_STATE_EVENT = "kept-card-state";
type CardReactDetail = { card: string; reaction: Reaction | null };

// A heart with its count, for a shared card or a passage in Discover. Flips at once; the save
// follows. A card's likes come in reactions (hold the card, CardReact): the commonest few show
// in place of the heart. `size="sm"` sits under a gallery tile.
export function LikeButton({
  target,
  likes,
  liked,
  reaction,
  top = [],
  size = "md",
  className,
}: {
  target: Target;
  likes: number;
  liked: boolean;
  reaction?: string | null; // a card: the viewer's kind of like
  top?: string[]; // a card: its commonest reactions
  size?: "sm" | "md";
  className?: string;
}) {
  // Local state, not a refresh: the list stays where it is (a like would re-rank it under your
  // finger); the new order shows next time the list opens.
  const mine0: Reaction | null = liked ? (isReaction(reaction) ? reaction : "heart") : null;
  const [state, setState] = useState({ likes, mine: mine0, top: top.filter(isReaction) });
  const card = "card" in target ? target.card : null;

  const set = (next: Reaction | null) => {
    const was = state;
    const delta = (next ? 1 : 0) - (was.mine ? 1 : 0);
    const likesNow = Math.max(0, was.likes + delta);
    const others = was.top.filter((r) => r !== was.mine || likesNow > 1);
    setState({ likes: likesNow, mine: next, top: next && !others.includes(next) ? [next, ...others].slice(0, 3) : others });
    if (card) dispatchEvent(new CustomEvent<CardReactDetail>(CARD_STATE_EVENT, { detail: { card, reaction: next } }));
    ("card" in target ? likeCard(target.card, next ?? false) : likeVerse(target.verse, next !== null))
      .then((r) => {
        if (!r.error) return;
        setState(was);
        askGuestToSave(r.error);
      })
      .catch(() => setState(was));
  };

  useEffect(() => {
    if (!card) return;
    const onReact = (e: Event) => {
      const d = (e as CustomEvent<CardReactDetail>).detail;
      if (d.card === card) set(d.reaction);
    };
    addEventListener(CARD_REACT_EVENT, onReact);
    return () => removeEventListener(CARD_REACT_EVENT, onReact);
  });

  const shown = card && state.likes > 0 ? state.top : [];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        set(state.mine ? null : "heart");
      }}
      aria-pressed={state.mine !== null}
      aria-label={state.mine ? `${REACTIONS[state.mine].label}, ${state.likes}` : `Like${state.likes ? `, ${state.likes}` : ""}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full tabular-nums transition-colors",
        size === "sm" ? "h-7 px-1.5 text-xs" : "h-9 px-3 text-sm",
        state.mine ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {shown.length > 0 ? (
        <span key={state.mine ?? "none"} className={cn("flex -space-x-1", state.mine && "animate-pop")} aria-hidden>
          {shown.map((r) => (
            <span key={r} className={cn("leading-none", size === "sm" ? "text-[0.8rem]" : "text-base")}>
              {REACTIONS[r].emoji}
            </span>
          ))}
        </span>
      ) : (
        <Heart
          key={String(state.mine)}
          className={cn(size === "sm" ? "size-3.5" : "size-4", state.mine && "animate-pop fill-current")}
          aria-hidden
        />
      )}
      {state.likes > 0 && state.likes.toLocaleString()}
    </button>
  );
}

// Someone else's card, held to react to it; its LikeButton shows and saves the reaction.
export function CardReact({
  card,
  reaction,
  className,
  children,
}: {
  card: string;
  reaction: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<Reaction | null>(isReaction(reaction) ? reaction : null);
  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<CardReactDetail>).detail;
      if (d.card === card) setCurrent(d.reaction);
    };
    addEventListener(CARD_STATE_EVENT, onState);
    return () => removeEventListener(CARD_STATE_EVENT, onState);
  }, [card]);
  return (
    <HoldReact
      reaction={current}
      badge={false}
      className={className}
      onReact={(r) => {
        setCurrent(r);
        dispatchEvent(new CustomEvent<CardReactDetail>(CARD_REACT_EVENT, { detail: { card, reaction: r } }));
      }}
    >
      {children}
    </HoldReact>
  );
}
