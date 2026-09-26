"use client";

import { useMemo, useState } from "react";
import { blankOrder, isRightWord, type FillBlanksPuzzle, type FillBlanksState } from "@/lib/games/fill-blanks";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function FillBlanksGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: FillBlanksPuzzle;
  initialState: FillBlanksState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const order = useMemo(() => blankOrder(puzzle), [puzzle]);
  const game = useGame<FillBlanksState>(
    id,
    {
      filled: initialState.filled ?? 0,
      mistakes: initialState.mistakes ?? puzzle.verses.map(() => 0),
      gaveUp: initialState.gaveUp,
    },
    initialStatus,
  );
  const [wrong, setWrong] = useState<{ index: number; n: number } | null>(null);
  const { filled, mistakes } = game.state;
  const active = order[filled];

  // The bank minus words already placed (one instance each).
  const remaining = useMemo(() => {
    const left = puzzle.bank.map((word, index) => ({ word, index }));
    for (const b of order.slice(0, filled)) {
      const at = left.findIndex((w) => isRightWord(w.word, b.answer));
      if (at !== -1) left.splice(at, 1);
    }
    return left;
  }, [puzzle.bank, order, filled]);

  function choose(word: string, index: number) {
    if (!game.playing || !active) return;
    if (isRightWord(word, active.answer)) {
      const state = { ...game.state, filled: filled + 1 };
      setWrong(null);
      if (state.filled === order.length) void game.finish(state);
      else game.update(state);
    } else {
      const m = [...mistakes];
      m[active.verseIndex] = (m[active.verseIndex] ?? 0) + 1;
      setWrong({ index, n: (wrong?.n ?? 0) + 1 });
      game.update({ ...game.state, mistakes: m });
    }
  }

  const totalMistakes = mistakes.reduce((a, b) => a + b, 0);
  const won = game.status === "won";

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle
        name="Fill the Blanks"
        detail={puzzle.verses.length > 1 ? `${puzzle.verses.length} verses` : `${puzzle.verses[0].reference} · ${puzzle.verses[0].translation}`}
      />

      <div className="flex flex-col gap-5">
        {puzzle.verses.map((v, vi) => (
          <figure key={v.verseId}>
            {puzzle.verses.length > 1 && (
              <figcaption className="mb-1 text-sm font-medium text-muted-foreground">
                {v.reference} · {v.translation}
              </figcaption>
            )}
            <p className="font-serif text-lg leading-loose">
              {v.tokens.map((t, ti) => {
                const at = order.findIndex((b) => b.verseIndex === vi && b.tokenIndex === ti);
                if (at === -1)
                  return (
                    <span key={ti}>
                      {t.pre}
                      {t.word}
                      {t.post}
                    </span>
                  );
                const shown = at < filled || !game.playing;
                const isActive = at === filled && game.playing;
                return (
                  <span key={ti}>
                    {t.pre}
                    <span
                      className={cn(
                        "inline-block min-w-12 rounded-md px-1 text-center transition-colors",
                        shown
                          ? at < filled
                            ? "animate-pop font-medium text-primary"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                          : isActive
                            ? "border-b-2 border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-b-2 border-muted-foreground/40",
                      )}
                    >
                      {shown ? t.word : " "}
                    </span>
                    {t.post}
                  </span>
                );
              })}
            </p>
          </figure>
        ))}
      </div>

      {game.playing ? (
        <>
          <div className="sticky bottom-0 -mx-4 mt-6 border-t bg-background/90 px-4 pb-4 pt-3 backdrop-blur-md">
            <p className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>
                {filled} of {order.length}
              </span>
              <span>{totalMistakes === 0 ? "No mistakes" : `${totalMistakes} ${totalMistakes === 1 ? "mistake" : "mistakes"}`}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {remaining.map(({ word, index }) => (
                <button
                  key={`${index}-${wrong?.index === index ? wrong.n : 0}`}
                  type="button"
                  onClick={() => choose(word, index)}
                  className={cn(
                    "h-11 rounded-xl border bg-card px-4 font-serif text-lg transition-colors hover:bg-muted active:scale-95",
                    wrong?.index === index && "animate-shake border-destructive/50 text-destructive",
                  )}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
          <GiveUp onConfirm={() => void game.finish({ ...game.state, gaveUp: true })} />
        </>
      ) : (
        <GameOver
          won={won}
          headline={won ? (totalMistakes === 0 ? "Perfect" : "All filled in") : "Here's the full text"}
          result={
            won
              ? totalMistakes === 0
                ? "No mistakes"
                : `${totalMistakes} ${totalMistakes === 1 ? "mistake" : "mistakes"}`
              : "Gave up"
          }
          verses={puzzle.verses.map((v) => ({
            reference: v.reference,
            translation: v.translation,
            text: v.tokens.map((t) => t.pre + t.word + t.post).join(""),
          }))}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
