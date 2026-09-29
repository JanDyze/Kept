"use client";

import { useEffect, useRef, useState } from "react";
import { hint, sameWord, type FirstLettersPuzzle, type FirstLettersState } from "@/lib/games/first-letters";
import { cn } from "@/lib/utils";
import {
  ActionBar,
  DoneBadge,
  GameError,
  GameResult,
  KeyboardFit,
  mistakesText,
  Segments,
  useResultShown,
  VerseCard,
} from "./game-parts";
import { gameScore } from "@/lib/games/summary";
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
  const { typed, mistakes, gaveUp } = game.state;
  const total = puzzle.tokens.length;
  const current = puzzle.tokens[typed];
  const resultShown = useResultShown(game.playing, gaveUp);

  // Keep the word being typed in view as the verse scrolls inside its card.
  const currentWord = useRef<HTMLSpanElement>(null);
  const showCurrentWord = () => {
    currentWord.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  useEffect(() => {
    currentWord.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [typed]);

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

  const fullText = puzzle.tokens.map((t) => t.pre + t.word + t.post).join("");

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameResult
          won={won}
          headline={won ? "All typed" : "Here's the verse"}
          score={gameScore({ game: "first_letters", status: game.status, state: game.state, puzzle })}
          next={next}
        >
          <VerseCard reference={puzzle.reference} translation={puzzle.translation}>
            {fullText}
          </VerseCard>
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  return (
    <KeyboardFit onResize={showCurrentWord}>
      <Segments parts={[typed / total]} />

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl">
        <VerseCard
          reference={puzzle.reference}
          translation={puzzle.translation}
          aside={typed === total && <DoneBadge />}
        >
          {puzzle.tokens.map((t, i) => (
            <span key={i}>
              {t.pre}
              {i < typed ? (
                <span className="animate-pop inline-block">{t.word}</span>
              ) : (
                <span
                  ref={i === typed ? currentWord : undefined}
                  className={cn(
                    "scroll-my-4 rounded px-0.5 tracking-wider",
                    i === typed
                      ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground/70",
                  )}
                >
                  {hint(t.word)}
                </span>
              )}
              {t.post}
            </span>
          ))}
        </VerseCard>
      </div>

      <ActionBar
        left={`${typed} of ${total}`}
        right={mistakesText(mistakes)}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ ...game.state, gaveUp: true })}
      >
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
            disabled={!game.playing}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-label={`Type the word starting with ${current?.word.charAt(0) ?? ""}`}
            placeholder={current ? `${current.word.charAt(0)}…` : ""}
            className={cn(
              "h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 font-serif text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
              shake > 0 && "animate-shake border-destructive/50",
            )}
          />
          <button
            type="button"
            disabled={!game.playing}
            onClick={() => advance(true)}
            className="h-12 shrink-0 rounded-xl border px-3.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Show word
          </button>
        </div>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </KeyboardFit>
  );
}
