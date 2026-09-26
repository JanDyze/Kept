"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { SPOT_LIVES, spotOutcome, type SpotChangePuzzle, type SpotChangeState } from "@/lib/games/spot-change";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
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
  const { found, misses } = game.state;
  const original = (i: number) => puzzle.originals[puzzle.changed.indexOf(i)];

  function tap(i: number) {
    if (!game.playing || found.includes(i)) return;
    const state = puzzle.changed.includes(i)
      ? { ...game.state, found: [...found, i] }
      : { ...game.state, misses: misses + 1 };
    if (!puzzle.changed.includes(i)) setWrong({ index: i, n: (wrong?.n ?? 0) + 1 });
    if (spotOutcome(puzzle, state) === "playing") game.update(state);
    else void game.finish(state);
  }

  const won = game.status === "won";
  const realText = puzzle.tokens
    .map((t, i) => t.pre + (puzzle.changed.includes(i) ? original(i) : t.word) + t.post)
    .join("");

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Spot the Change" detail={`${puzzle.reference} · ${puzzle.translation}`} />

      {game.playing && (
        <p className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {found.length} of {puzzle.changed.length} found
          </span>
          <span className="flex gap-1" aria-label={`${SPOT_LIVES - misses} lives left`}>
            {Array.from({ length: SPOT_LIVES }, (_, k) => (
              <Heart
                key={k}
                className={cn("size-4", k < SPOT_LIVES - misses ? "fill-rose-500 text-rose-500" : "text-muted-foreground/40")}
                aria-hidden
              />
            ))}
          </span>
        </p>
      )}

      <p className="font-serif text-xl leading-loose">
        {puzzle.tokens.map((t, i) => {
          const changed = puzzle.changed.includes(i);
          const isFound = found.includes(i);
          const reveal = !game.playing && changed;
          return (
            <span key={i}>
              {t.pre}
              {isFound || reveal ? (
                <span
                  className={cn(
                    "animate-pop inline-block rounded px-0.5",
                    isFound ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100" : "bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100",
                  )}
                >
                  <span className="mr-1 text-sm text-muted-foreground line-through">{t.word}</span>
                  {original(i)}
                </span>
              ) : (
                <button
                  key={`${i}-${wrong?.index === i ? wrong.n : 0}`}
                  type="button"
                  onClick={() => tap(i)}
                  disabled={!game.playing}
                  className={cn(
                    "rounded px-0.5 transition-colors hover:bg-muted active:bg-muted",
                    wrong?.index === i && "animate-shake bg-rose-50 dark:bg-rose-950/40",
                  )}
                >
                  {t.word}
                </button>
              )}
              {t.post}
            </span>
          );
        })}
      </p>

      {game.playing ? (
        <GiveUp onConfirm={() => void game.finish({ ...game.state, gaveUp: true })} />
      ) : (
        <GameOver
          won={won}
          headline={won ? "Sharp eyes" : "Not this time"}
          result={won ? (misses === 0 ? "No misses" : `${misses} ${misses === 1 ? "miss" : "misses"}`) : game.state.gaveUp ? "Gave up" : "Out of lives"}
          verses={[{ reference: puzzle.reference, translation: puzzle.translation, text: realText }]}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
