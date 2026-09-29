"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { matchUpOutcome, type MatchUpPuzzle, type MatchUpState } from "@/lib/games/match-up";
import { cn } from "@/lib/utils";
import { gameScore } from "@/lib/games/summary";
import { ActionBar, GameError, GameResult, mistakesText, Segments, useResultShown } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function MatchUpGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: MatchUpPuzzle;
  initialState: MatchUpState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const game = useGame<MatchUpState>(
    id,
    { matched: initialState.matched ?? [], mistakes: initialState.mistakes ?? 0, gaveUp: initialState.gaveUp },
    initialStatus,
  );
  const [picked, setPicked] = useState<number | null>(null); // selected reference (pair index)
  const [wrong, setWrong] = useState<{ index: number; n: number } | null>(null);
  const { matched, mistakes, gaveUp } = game.state;
  const total = puzzle.pairs.length;
  const resultShown = useResultShown(game.playing, gaveUp);

  function chooseText(pairIndex: number) {
    if (!game.playing || picked === null || matched.includes(pairIndex)) return;
    if (pairIndex === picked) {
      const state = { ...game.state, matched: [...matched, pairIndex] };
      setPicked(null);
      setWrong(null);
      if (matchUpOutcome(puzzle, state) === "playing") game.update(state);
      else void game.finish(state);
    } else {
      setWrong({ index: pairIndex, n: (wrong?.n ?? 0) + 1 });
      game.update({ ...game.state, mistakes: mistakes + 1 });
    }
  }

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameResult
          won={won}
          headline={won ? "All matched" : "Here they are"}
          score={gameScore({ game: "match_up", status: game.status, state: game.state, puzzle })}
          next={next}
        >
          <ul className="divide-y rounded-2xl border bg-card">
            {puzzle.pairs.map((p, i) => (
              <li key={p.verseId} className="px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  {matched.includes(i) && <Check className="size-4 text-primary" strokeWidth={3} aria-hidden />}
                  {p.reference}
                  <span className="font-normal text-muted-foreground">· {p.translation}</span>
                </p>
                <p className="mt-1 font-serif text-[1.02rem] leading-relaxed text-muted-foreground">{p.snippet}</p>
              </li>
            ))}
          </ul>
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Segments parts={puzzle.pairs.map((_, k) => (k < matched.length ? 1 : 0))} />

      <ul className="mt-4 flex flex-col gap-2.5">
        {puzzle.textOrder.map((pairIndex) => {
          const p = puzzle.pairs[pairIndex];
          const done = matched.includes(pairIndex);
          return (
            <li key={p.verseId}>
              <button
                key={`${pairIndex}-${wrong?.index === pairIndex ? wrong.n : 0}`}
                type="button"
                disabled={done || picked === null || !game.playing}
                onClick={() => chooseText(pairIndex)}
                className={cn(
                  "w-full rounded-2xl border bg-card p-4 text-left transition-[border-color,background-color,opacity]",
                  done
                    ? "border-primary/40"
                    : picked === null
                      ? "opacity-70"
                      : "border-primary/30 hover:border-primary/60 hover:bg-muted/40",
                  wrong?.index === pairIndex && "animate-shake border-destructive/60",
                )}
              >
                {done && (
                  <span className="animate-pop mb-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <Check className="size-4" strokeWidth={3} aria-hidden /> {p.reference}
                  </span>
                )}
                <span className={cn("block font-serif text-[1.05rem] leading-relaxed", done && "text-muted-foreground")}>
                  {p.snippet}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ActionBar
        left={`${matched.length} of ${total}`}
        right={mistakesText(mistakes)}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ ...game.state, gaveUp: true })}
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="References">
          {puzzle.pairs.map((p, i) =>
            matched.includes(i) ? null : (
              <button
                key={p.verseId}
                type="button"
                disabled={!game.playing}
                onClick={() => setPicked(picked === i ? null : i)}
                aria-pressed={picked === i}
                className={cn(
                  "h-11 rounded-xl border px-4 font-medium transition-[background-color,border-color,color,scale] active:scale-95",
                  picked === i ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {p.reference}
              </button>
            ),
          )}
        </div>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
