"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { matchUpOutcome, type MatchUpPuzzle, type MatchUpState } from "@/lib/games/match-up";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
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
  const { matched, mistakes } = game.state;

  function chooseText(pairIndex: number) {
    if (!game.playing || picked === null || matched.includes(pairIndex)) return;
    if (pairIndex === picked) {
      const state = { ...game.state, matched: [...matched, pairIndex] };
      setPicked(null);
      if (matchUpOutcome(puzzle, state) === "playing") game.update(state);
      else void game.finish(state);
    } else {
      setWrong({ index: pairIndex, n: (wrong?.n ?? 0) + 1 });
      game.update({ ...game.state, mistakes: mistakes + 1 });
    }
  }

  const won = game.status === "won";

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Match Up" detail={`${puzzle.pairs.length} verses`} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="References">
        {puzzle.pairs.map((p, i) => {
          const done = matched.includes(i) || !game.playing;
          return (
            <button
              key={p.verseId}
              type="button"
              disabled={done}
              onClick={() => setPicked(picked === i ? null : i)}
              aria-pressed={picked === i}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                done
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : picked === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card hover:bg-muted",
              )}
            >
              {p.reference}
            </button>
          );
        })}
      </div>

      <p className="mt-4 min-h-5 text-sm text-muted-foreground">
        {game.playing ? (picked === null ? "Pick a reference" : `Now tap the text for ${puzzle.pairs[picked].reference}`) : null}
      </p>

      <ul className="mt-2 flex flex-col gap-2.5">
        {puzzle.textOrder.map((pairIndex) => {
          const p = puzzle.pairs[pairIndex];
          const done = matched.includes(pairIndex) || !game.playing;
          return (
            <li key={p.verseId}>
              <button
                key={`${pairIndex}-${wrong?.index === pairIndex ? wrong.n : 0}`}
                type="button"
                disabled={done || picked === null}
                onClick={() => chooseText(pairIndex)}
                className={cn(
                  "w-full rounded-2xl border bg-card p-4 text-left transition-colors",
                  done && "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40",
                  !done && picked !== null && "hover:border-primary/40 hover:bg-muted/40",
                  wrong?.index === pairIndex && "animate-shake border-destructive/50",
                )}
              >
                {done && (
                  <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <Check className="size-3.5" aria-hidden /> {p.reference}
                  </span>
                )}
                <span className="block font-serif text-[1.05rem] leading-relaxed">{p.snippet}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {game.playing ? (
        <GiveUp onConfirm={() => void game.finish({ ...game.state, gaveUp: true })} />
      ) : (
        <GameOver
          won={won}
          headline={won ? (mistakes === 0 ? "Perfect" : "All matched") : "Here they are"}
          result={won ? (mistakes === 0 ? "No mistakes" : `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`) : "Gave up"}
          verses={[]}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
