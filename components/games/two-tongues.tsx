"use client";

import { useState } from "react";
import { correctCount, twoTonguesOutcome, type TwoTonguesPuzzle, type TwoTonguesState } from "@/lib/games/two-tongues";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function TwoTonguesGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: TwoTonguesPuzzle;
  initialState: TwoTonguesState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const game = useGame<TwoTonguesState>(id, { answers: initialState.answers ?? [], gaveUp: initialState.gaveUp }, initialStatus);
  // The round on screen; stays on an answered round until "Next" so the result can be seen.
  const [shown, setShown] = useState(Math.min(game.state.answers.length, puzzle.rounds.length - 1));
  const { answers } = game.state;
  const round = puzzle.rounds[shown];
  const chosen = answers[shown];
  const answered = chosen !== undefined;

  function choose(option: number) {
    if (!game.playing || answered) return;
    const state = { ...game.state, answers: [...answers, option] };
    if (twoTonguesOutcome(puzzle, state) === "playing") game.update(state);
    else void game.finish(state);
  }

  const won = game.status === "won";
  const score = correctCount(puzzle, game.state);

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Two Tongues" detail={`Round ${shown + 1} of ${puzzle.rounds.length}`} />

      <figure className="rounded-2xl bg-muted/60 p-4">
        <figcaption className="mb-1.5 text-xs font-medium text-muted-foreground">
          {round.reference} · {round.from}
        </figcaption>
        <blockquote className="font-serif text-lg leading-relaxed">{round.text}</blockquote>
      </figure>

      <p className="mt-5 text-sm text-muted-foreground">Which is the {round.to}?</p>
      <ul className="mt-2 flex flex-col gap-2.5">
        {round.options.map((text, i) => {
          const isAnswer = i === round.answer;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered || !game.playing}
                onClick={() => choose(i)}
                className={cn(
                  "w-full rounded-2xl border bg-card p-4 text-left font-serif text-[1.02rem] leading-relaxed transition-colors",
                  !answered && game.playing && "hover:border-primary/40 hover:bg-muted/40",
                  answered && isAnswer && "animate-pop border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50",
                  answered && chosen === i && !isAnswer && "animate-shake border-rose-400 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40",
                )}
              >
                {text}
              </button>
            </li>
          );
        })}
      </ul>

      {game.playing ? (
        <>
          {answered && shown < puzzle.rounds.length - 1 && (
            <Button className="mt-5 h-12 text-base" onClick={() => setShown(shown + 1)}>
              Next verse
            </Button>
          )}
          <GiveUp onConfirm={() => void game.finish({ ...game.state, gaveUp: true })} />
        </>
      ) : (
        <GameOver
          won={won}
          headline={won ? "Bilingual" : "Not this time"}
          result={game.state.gaveUp ? "Gave up" : `${score} of ${puzzle.rounds.length} right`}
          verses={[]}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
