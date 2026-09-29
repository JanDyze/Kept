import Link from "next/link";
import { Check, ChevronRight, Play, X } from "lucide-react";
import { GameIcon } from "@/components/game-icons";
import type { DailyGame } from "@/lib/db/schema";
import type { GameId, GameInfo } from "@/lib/games/registry";
import { hasStarted, resultLabel } from "@/lib/games/summary";
import { cn } from "@/lib/utils";

// Why a game isn't on today's shelf (the verses don't fit it yet).
const UNAVAILABLE: Partial<Record<GameId, string>> = {
  match_up: "Needs 2 verses",
  two_tongues: "Needs ESV or MBBTAG",
  unscramble: "Needs a longer verse",
  first_letters: "Needs a longer verse",
  missing_word: "Needs a longer word",
  spot_change: "Needs a longer verse",
};

export type GameEntry = { info: GameInfo; game?: Pick<DailyGame, "game" | "status" | "state" | "puzzle"> };

// One game on the Games page: its icon, name and line, where today's game stands, and Play.
export function GameCard({ info, game }: GameEntry) {
  const playing = game?.status === "in_progress";
  const started = game ? hasStarted(game) : false;
  const result = game ? resultLabel(game) : null;
  const won = game?.status === "won";
  const lost = game?.status === "lost";

  const status = !game
    ? (UNAVAILABLE[info.id] ?? "Not today")
    : playing
      ? started
        ? "In progress"
        : "Not started"
      : won
        ? `Done · ${result}`
        : result === "Gave up" || result === "Out of lives"
          ? result
          : "Not solved";

  return (
    <Link
      href={`/games/${info.slug}`}
      transitionTypes={["nav-forward"]}
      aria-label={`${info.name}: ${status}`}
      style={{ "--game-hue": info.hue } as React.CSSProperties}
      className={cn(
        "game-tint group flex items-start gap-4 rounded-3xl border p-4",
        "transition-[transform,background-color,border-color] duration-200 ease-out active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        game
          ? "border-(--game-border) bg-(--game-bg) hover:bg-(--game-bg-hover)"
          : "border-dashed bg-transparent hover:border-foreground/15 hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "relative flex size-18 shrink-0 items-center justify-center rounded-[26%]",
          game ? "bg-(--game-tile)" : "bg-icon-tile opacity-45",
        )}
      >
        <GameIcon game={info.id} className="size-[66%]" />
        {(won || lost) && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-2 border-(--game-bg)",
              won ? "bg-primary text-primary-foreground" : "bg-muted-foreground text-background",
            )}
          >
            {won ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <X className="size-3.5" strokeWidth={3} aria-hidden />}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn("block font-brand text-xl font-semibold leading-tight tracking-tight", !game && "text-muted-foreground")}>
          {info.name}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{info.blurb}</span>
        {/* Where today's game stands, with Play (or Continue) beside it. */}
        <span className="mt-2.5 flex min-h-9 items-center justify-between gap-3">
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm",
              playing && started ? "font-medium text-primary" : won ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {playing && (
              <span aria-hidden className={cn("size-2 shrink-0 rounded-full", started ? "bg-primary" : "border-[1.5px] border-muted-foreground/60")} />
            )}
            {status}
          </span>
          {playing ? (
            <span
              aria-hidden
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-transform duration-200 motion-safe:group-engaged:scale-105",
                started ? "border-2 border-primary text-primary" : "bg-primary text-primary-foreground",
              )}
            >
              <Play className="size-3.5 fill-current" aria-hidden />
              {started ? "Continue" : "Play"}
            </span>
          ) : (
            game && (
              <ChevronRight
                aria-hidden
                className="size-5 shrink-0 text-muted-foreground/60 transition-transform duration-300 motion-safe:group-engaged:translate-x-1"
              />
            )
          )}
        </span>
      </span>
    </Link>
  );
}
