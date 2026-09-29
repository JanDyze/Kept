import Link from "next/link";
import { Check, ChevronRight, Play, Star, X } from "lucide-react";
import { GameIcon } from "@/components/game-icons";
import type { DailyGame } from "@/lib/db/schema";
import type { GameId, GameInfo } from "@/lib/games/registry";
import { gameScore, hasStarted, scoreText } from "@/lib/games/summary";
import { ResultMark } from "./result-mark";
import { cn } from "@/lib/utils";

// Why a game isn't on today's shelf (the verses don't fit it yet).
const UNAVAILABLE: Partial<Record<GameId, string>> = {
  match_up: "Needs 2 verses",
  two_tongues: "Needs ESV or MBBTAG",
  unscramble: "Needs a longer verse",
  first_letters: "Needs a longer verse",
  type_it: "Needs a verse under 80 words",
  say_it: "Needs a verse under 80 words",
  missing_word: "Needs a longer word",
  spot_change: "Needs a longer verse",
};

export type GameEntry = { info: GameInfo; game?: Pick<DailyGame, "game" | "status" | "state" | "puzzle">; starred?: boolean };

// One game on the Games page: its icon, name and line, where today's game stands, and Play.
export function GameCard({ info, game, starred }: GameEntry) {
  const playing = game?.status === "in_progress";
  const started = game ? hasStarted(game) : false;
  const score = game ? gameScore(game) : null;
  const won = game?.status === "won";
  const lost = game?.status === "lost";
  const perfect = score?.kind === "perfect";

  const status = !game
    ? (UNAVAILABLE[info.id] ?? "Not today")
    : playing
      ? started
        ? "In progress"
        : "Not started"
      : score
        ? scoreText(score)
        : "Done";

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
        {/* A finished game's status covers its icon; hovering or holding the card lifts it off. */}
        {(won || lost) && (
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-[inherit] transition-opacity duration-300 ease-out motion-safe:group-engaged:opacity-0",
              // The mark carries the color, ringed in the tile's so it reads over the icon.
              "[&>svg]:[filter:drop-shadow(0_0_1.5px_var(--game-tile))_drop-shadow(0_0_1.5px_var(--game-tile))_drop-shadow(0_0_1px_var(--game-tile))]",
              perfect ? "text-icon-accent" : won ? "text-(--game-strong)" : "text-muted-foreground",
            )}
          >
            {perfect ? (
              <Star className="size-10 fill-current" aria-hidden />
            ) : won ? (
              <Check className="size-11" strokeWidth={3.5} aria-hidden />
            ) : (
              <X className="size-10" strokeWidth={3.5} aria-hidden />
            )}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn("flex items-center gap-1.5 font-brand text-xl font-semibold leading-tight tracking-tight", !game && "text-muted-foreground")}>
          {info.name}
          {starred && <Star className="size-4 shrink-0 fill-icon-accent text-icon-accent" aria-label="Starred" />}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{info.blurb}</span>
        {/* Where today's game stands, with Play (or Continue) beside it. */}
        <span className="mt-2.5 flex min-h-9 items-center justify-between gap-3">
          {score ? (
            <ResultMark score={score} />
          ) : (
            <span className={cn("flex items-center gap-1.5 text-sm", playing && started ? "font-medium text-primary" : "text-muted-foreground")}>
              {playing && (
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", started ? "bg-primary" : "border-[1.5px] border-muted-foreground/60")} />
              )}
              {status}
            </span>
          )}
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
