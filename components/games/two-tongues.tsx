"use client";

import { useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { correctCount, twoTonguesOutcome, type TwoTonguesPuzzle, type TwoTonguesState } from "@/lib/games/two-tongues";
import { cn } from "@/lib/utils";
import { gameScore } from "@/lib/games/summary";
import { ActionBar, GameDetail, GameError, GameResult, Segments, useResultShown, VerseCard } from "./game-parts";
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
  const total = puzzle.rounds.length;
  // The round on screen; stays on an answered round until "Next" so the result can be seen.
  const [shown, setShown] = useState(Math.min(game.state.answers.length, total - 1));
  const { answers, gaveUp } = game.state;
  const round = puzzle.rounds[shown];
  const chosen = answers[shown];
  const answered = chosen !== undefined;
  const score = correctCount(puzzle, game.state);
  const resultShown = useResultShown(game.playing, gaveUp, 1400);

  function choose(option: number) {
    if (!game.playing || answered) return;
    const state = { ...game.state, answers: [...answers, option] };
    if (twoTonguesOutcome(puzzle, state) === "playing") game.update(state);
    else void game.finish(state);
  }

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameResult
          won={won}
          headline={won ? "Bilingual" : "Not this time"}
          score={gameScore({ game: "two_tongues", status: game.status, state: game.state, puzzle })}
          next={next}
        >
          <ul className="divide-y rounded-2xl border bg-card">
            {puzzle.rounds.map((r, i) => {
              const right = answers[i] === r.answer;
              return (
                <li key={r.verseId} className="px-4 py-3.5">
                  <p className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {r.reference} <span className="font-normal text-muted-foreground">· {r.to}</span>
                    </span>
                    {answers[i] === undefined ? (
                      <span className="text-muted-foreground">Skipped</span>
                    ) : right ? (
                      <Check className="size-4 text-primary" strokeWidth={3} aria-label="Right" />
                    ) : (
                      <X className="size-4 text-destructive" strokeWidth={3} aria-label="Wrong" />
                    )}
                  </p>
                  <p className="mt-1 font-serif text-[1.02rem] leading-relaxed text-muted-foreground">{r.options[r.answer]}</p>
                </li>
              );
            })}
          </ul>
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <GameDetail text={`Round ${shown + 1} of ${total}`} />
      <Segments parts={puzzle.rounds.map((_, i) => (i < answers.length ? 1 : 0))} />

      <div key={shown} className="animate-rise">
        <VerseCard reference={round.reference} translation={round.from} className="mt-4 [&>div]:text-lg [&>div]:leading-relaxed">
          {round.text}
        </VerseCard>

        <p className="mt-5 mb-2 text-sm font-medium text-muted-foreground">{round.to}</p>
        <ul className="flex flex-col gap-2.5">
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
                    answered && !isAnswer && chosen !== i && "opacity-50",
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
      </div>

      <ActionBar
        left={`${score} right`}
        right={`${answers.length} of ${total}`}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ ...game.state, gaveUp: true })}
      >
        {answered && game.playing && shown < total - 1 && (
          <Button className="animate-rise h-12 w-full gap-1 text-base" onClick={() => setShown(shown + 1)}>
            Next verse <ChevronRight className="size-4" aria-hidden />
          </Button>
        )}
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
