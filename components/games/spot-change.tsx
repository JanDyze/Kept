"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { SPOT_LIVES, spotOutcome, type SpotChangePuzzle, type SpotChangeState } from "@/lib/games/spot-change";
import { cn } from "@/lib/utils";
import { ActionBar, countText, DoneBadge, GameError, GameResult, Segments, useResultShown, VerseCard } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function SpotChangeGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: SpotChangePuzzle;
  initialState: SpotChangeState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const game = useGame<SpotChangeState>(
    id,
    { found: initialState.found ?? [], misses: initialState.misses ?? 0, gaveUp: initialState.gaveUp },
    initialStatus,
  );
  const [wrong, setWrong] = useState<{ index: number; n: number } | null>(null);
  const { found, misses, gaveUp } = game.state;
  const total = puzzle.changed.length;
  const original = (i: number) => puzzle.originals[puzzle.changed.indexOf(i)];
  const resultShown = useResultShown(game.playing, gaveUp, 1100);

  function tap(i: number) {
    if (!game.playing || found.includes(i)) return;
    const hit = puzzle.changed.includes(i);
    const state = hit ? { ...game.state, found: [...found, i] } : { ...game.state, misses: misses + 1 };
    if (!hit) setWrong({ index: i, n: (wrong?.n ?? 0) + 1 });
    if (spotOutcome(puzzle, state) === "playing") game.update(state);
    else void game.finish(state);
  }

  // A swapped word, struck through, with the real one beside it.
  const swap = (i: number, tone: "found" | "missed") => (
    <span
      className={cn(
        "animate-pop inline-block rounded-md px-1 leading-snug",
        tone === "found"
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
      )}
    >
      <span className="mr-1 text-[0.8em] line-through opacity-60">{puzzle.tokens[i].word}</span>
      {original(i)}
    </span>
  );

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameResult
          won={won}
          headline={won ? "Sharp eyes" : "Not this time"}
          result={
            won
              ? misses === 0
                ? "No misses"
                : countText(misses, "miss", "misses")
              : gaveUp
                ? "Gave up"
                : "Out of lives"
          }
          next={next}
        >
          <VerseCard reference={puzzle.reference} translation={puzzle.translation}>
            {puzzle.tokens.map((t, i) => (
              <span key={i}>
                {t.pre}
                {puzzle.changed.includes(i) ? swap(i, found.includes(i) ? "found" : "missed") : t.word}
                {t.post}
              </span>
            ))}
          </VerseCard>
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  const lives = SPOT_LIVES - misses;
  return (
    <div className="flex flex-1 flex-col">
      <Segments parts={puzzle.changed.map((_, k) => (k < found.length ? 1 : 0))} />

      <VerseCard
        reference={puzzle.reference}
        translation={puzzle.translation}
        className="mt-4"
        aside={found.length === total && <DoneBadge />}
      >
        {puzzle.tokens.map((t, i) => (
          <span key={i}>
            {t.pre}
            {found.includes(i) || (!game.playing && puzzle.changed.includes(i)) ? (
              swap(i, found.includes(i) ? "found" : "missed")
            ) : (
              <button
                key={`${i}-${wrong?.index === i ? wrong.n : 0}`}
                type="button"
                data-token={i}
                onClick={() => tap(i)}
                disabled={!game.playing}
                className={cn(
                  "-mx-0.5 rounded-md px-0.5 leading-snug transition-colors hover:bg-muted active:bg-muted",
                  wrong?.index === i && "animate-shake bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
                )}
              >
                {t.word}
              </button>
            )}
            {t.post}
          </span>
        ))}
      </VerseCard>

      <ActionBar disabled={!game.playing} onGiveUp={() => void game.finish({ ...game.state, gaveUp: true })}>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {found.length} of {total} found
          </span>
          <span className="flex gap-1" aria-label={`${countText(lives, "life", "lives")} left`}>
            {Array.from({ length: SPOT_LIVES }, (_, k) => (
              <Heart
                key={`${k}-${k === lives ? misses : 0}`}
                className={cn(
                  "size-5",
                  k < lives ? "fill-rose-500 text-rose-500" : "animate-pop text-muted-foreground/40",
                )}
                aria-hidden
              />
            ))}
          </span>
        </div>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
