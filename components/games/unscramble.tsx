"use client";

import { useState } from "react";
import { isNextChunk, type UnscramblePuzzle, type UnscrambleState } from "@/lib/games/unscramble";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function UnscrambleGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: UnscramblePuzzle;
  initialState: UnscrambleState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const game = useGame<UnscrambleState>(
    id,
    { used: initialState.used ?? [], mistakes: initialState.mistakes ?? 0, gaveUp: initialState.gaveUp },
    initialStatus,
  );
  const [wrong, setWrong] = useState<{ index: number; n: number } | null>(null);
  const { used, mistakes } = game.state;

  function tap(chunkIndex: number) {
    if (!game.playing) return;
    if (isNextChunk(puzzle, used, chunkIndex)) {
      const state = { ...game.state, used: [...used, chunkIndex] };
      setWrong(null);
      if (state.used.length === puzzle.chunks.length) void game.finish(state);
      else game.update(state);
    } else {
      setWrong({ index: chunkIndex, n: (wrong?.n ?? 0) + 1 });
      game.update({ ...game.state, mistakes: mistakes + 1 });
    }
  }

  const won = game.status === "won";
  const fullText = puzzle.chunks.join(" ");

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Unscramble" detail={`${puzzle.reference} · ${puzzle.translation}`} />

      <p className="min-h-28 rounded-2xl bg-muted/60 p-4 font-serif text-lg leading-relaxed" aria-live="polite">
        {used.map((c, i) => (
          <span key={i} className="animate-pop inline-block">
            {puzzle.chunks[c]}
            {" "}
          </span>
        ))}
        {game.playing && <span className="inline-block h-6 w-0.5 translate-y-1 animate-pulse bg-primary" aria-hidden />}
      </p>

      {game.playing ? (
        <>
          <p className="mt-4 flex justify-end text-sm text-muted-foreground">
            <span>{mistakes === 0 ? "No mistakes" : `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {puzzle.order
              .filter((c) => !used.includes(c))
              .map((c) => (
                <button
                  key={`${c}-${wrong?.index === c ? wrong.n : 0}`}
                  type="button"
                  onClick={() => tap(c)}
                  className={cn(
                    "min-h-11 rounded-xl border bg-card px-3.5 py-2 text-left font-serif text-lg transition-colors hover:bg-muted active:scale-95",
                    wrong?.index === c && "animate-shake border-destructive/50 text-destructive",
                  )}
                >
                  {puzzle.chunks[c]}
                </button>
              ))}
          </div>
          <GiveUp onConfirm={() => void game.finish({ ...game.state, gaveUp: true })} />
        </>
      ) : (
        <GameOver
          won={won}
          headline={won ? (mistakes === 0 ? "Perfect" : "Back in order") : "Here's the verse"}
          result={won ? (mistakes === 0 ? "No mistakes" : `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`) : "Gave up"}
          verses={[{ reference: puzzle.reference, translation: puzzle.translation, text: fullText }]}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
