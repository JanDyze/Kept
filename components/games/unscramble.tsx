"use client";

import { useState } from "react";
import { isNextChunk, type UnscramblePuzzle, type UnscrambleState } from "@/lib/games/unscramble";
import { cn } from "@/lib/utils";
import { ActionBar, DoneBadge, GameError, GameResult, mistakesText, Segments, useResultShown, VerseCard } from "./game-parts";
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
  const { used, mistakes, gaveUp } = game.state;
  const total = puzzle.chunks.length;
  const resultShown = useResultShown(game.playing, gaveUp);

  function tap(chunkIndex: number) {
    if (!game.playing) return;
    if (isNextChunk(puzzle, used, chunkIndex)) {
      const state = { ...game.state, used: [...used, chunkIndex] };
      setWrong(null);
      if (state.used.length === total) void game.finish(state);
      else game.update(state);
    } else {
      setWrong({ index: chunkIndex, n: (wrong?.n ?? 0) + 1 });
      game.update({ ...game.state, mistakes: mistakes + 1 });
    }
  }

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameResult
          won={won}
          headline={won ? (mistakes === 0 ? "Perfect" : "Back in order") : "Here's the verse"}
          result={won ? mistakesText(mistakes) : "Gave up"}
          next={next}
        >
          <VerseCard reference={puzzle.reference} translation={puzzle.translation}>
            {puzzle.chunks.join(" ")}
          </VerseCard>
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  const done = used.length === total;
  return (
    <div className="flex flex-1 flex-col">
      <Segments parts={[used.length / total]} />

      <VerseCard
        reference={puzzle.reference}
        translation={puzzle.translation}
        className="mt-4 min-h-40"
        aside={done && <DoneBadge />}
      >
        <p aria-live="polite">
          {used.map((c, i) => (
            <span key={i} className="animate-pop inline-block">
              {puzzle.chunks[c]}&nbsp;
            </span>
          ))}
          {!done && <span className="inline-block h-6 w-0.5 translate-y-1 animate-pulse bg-primary" aria-hidden />}
        </p>
      </VerseCard>

      <ActionBar
        left={`${used.length} of ${total}`}
        right={mistakesText(mistakes)}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ ...game.state, gaveUp: true })}
      >
        <div className="flex min-h-11 flex-wrap gap-2">
          {puzzle.order
            .filter((c) => !used.includes(c))
            .map((c) => (
              <button
                key={`${c}-${wrong?.index === c ? wrong.n : 0}`}
                type="button"
                disabled={!game.playing}
                onClick={() => tap(c)}
                className={cn(
                  "min-h-11 rounded-xl border bg-card px-3.5 py-2 text-left font-serif text-lg transition-[background-color,scale] hover:bg-muted active:scale-95",
                  wrong?.index === c && "animate-shake border-destructive/50 text-destructive",
                )}
              >
                {puzzle.chunks[c]}
              </button>
            ))}
        </div>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
