"use client";

import { useState } from "react";
import { hint, sameWord, type FirstLettersPuzzle, type FirstLettersState } from "@/lib/games/first-letters";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function FirstLettersGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: FirstLettersPuzzle;
  initialState: FirstLettersState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const game = useGame<FirstLettersState>(
    id,
    { typed: initialState.typed ?? 0, mistakes: initialState.mistakes ?? 0, gaveUp: initialState.gaveUp },
    initialStatus,
  );
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(0);
  const { typed, mistakes } = game.state;
  const total = puzzle.tokens.length;
  const current = puzzle.tokens[typed];

  function advance(extraMistake: boolean) {
    const state = { ...game.state, typed: typed + 1, mistakes: mistakes + (extraMistake ? 1 : 0) };
    setValue("");
    if (state.typed === total) void game.finish(state);
    else game.update(state);
  }

  function onChange(next: string) {
    if (!game.playing || !current) return;
    // The right word advances as soon as it's typed; a space or Enter checks what's there.
    if (sameWord(next.trim(), current.word)) return advance(false);
    if (/\s$/.test(next) && next.trim()) {
      setShake((n) => n + 1);
      setValue("");
      game.update({ ...game.state, mistakes: mistakes + 1 });
      return;
    }
    setValue(next.replace(/^\s+/, ""));
  }

  const won = game.status === "won";

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="First Letters" detail={`${puzzle.reference} · ${puzzle.translation}`} />

      <p className="font-serif text-xl leading-loose">
        {puzzle.tokens.map((t, i) => (
          <span key={i}>
            {t.pre}
            {i < typed || !game.playing ? (
              <span className={cn(i < typed ? "text-foreground" : "text-amber-700 dark:text-amber-300")}>{t.word}</span>
            ) : (
              <span
                className={cn(
                  "rounded px-0.5 tracking-wider",
                  i === typed ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/30" : "text-muted-foreground",
                )}
              >
                {hint(t.word)}
              </span>
            )}
            {t.post}
          </span>
        ))}
      </p>

      {game.playing ? (
        <>
          <div className="sticky bottom-0 -mx-4 mt-6 border-t bg-background/90 px-4 pb-4 pt-3 backdrop-blur-md">
            <p className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>
                {typed} of {total}
              </span>
              <span>{mistakes === 0 ? "No mistakes" : `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`}</span>
            </p>
            <div className="flex gap-2">
              <input
                key={shake}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onChange(`${value} `);
                  }
                }}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="next"
                aria-label={`Type the word starting with ${current?.word.charAt(0) ?? ""}`}
                placeholder={current ? `${current.word.charAt(0)}…` : ""}
                className={cn(
                  "h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 font-serif text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
                  shake > 0 && "animate-shake",
                )}
              />
              <button
                type="button"
                onClick={() => advance(true)}
                className="h-12 shrink-0 rounded-xl border px-3 text-sm text-muted-foreground hover:bg-muted"
              >
                Show word
              </button>
            </div>
          </div>
          <GiveUp onConfirm={() => void game.finish({ ...game.state, gaveUp: true })} />
        </>
      ) : (
        <GameOver
          won={won}
          headline={won ? (mistakes === 0 ? "Perfect" : "All typed") : "Here's the verse"}
          result={won ? (mistakes === 0 ? "No mistakes" : `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`) : "Gave up"}
          verses={[{ reference: puzzle.reference, translation: puzzle.translation, text: puzzle.tokens.map((t) => t.pre + t.word + t.post).join("") }]}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}
