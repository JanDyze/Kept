"use client";

import { useEffect, useMemo, useState } from "react";
import { Delete } from "lucide-react";
import {
  MISSING_WORD_GUESSES,
  missingWordOutcome,
  scoreGuess,
  type MissingWordPuzzle,
  type MissingWordState,
  type TileColor,
} from "@/lib/games/missing-word";
import { normalizeWord } from "@/lib/games/words";
import { cn } from "@/lib/utils";
import { ActionBar, countText, GameError, GameResult, GameTitle, useResultShown, VerseCard } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const TILE: Record<TileColor, string> = {
  correct: "border-emerald-600 bg-emerald-600 text-white",
  present: "border-amber-500 bg-amber-500 text-white",
  absent: "border-stone-400 bg-stone-400 text-white",
};
const DOT: Record<TileColor, string> = { correct: "bg-emerald-600", present: "bg-amber-500", absent: "bg-stone-400" };
const RANK: Record<TileColor, number> = { absent: 0, present: 1, correct: 2 };

export function MissingWordGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  dictionary,
  next,
}: {
  id: string;
  puzzle: MissingWordPuzzle;
  initialState: MissingWordState;
  initialStatus: GameStatus;
  dictionary: string[];
  next?: { href: string; name: string };
}) {
  const game = useGame<MissingWordState>(id, { guesses: initialState.guesses ?? [] }, initialStatus);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState(0);
  const words = useMemo(() => new Set(dictionary), [dictionary]);
  const length = puzzle.answer.length;
  const { guesses } = game.state;
  const scored = useMemo(() => guesses.map((g) => scoreGuess(g, puzzle.answer)), [guesses, puzzle.answer]);

  const keyColors = useMemo(() => {
    const map = new Map<string, TileColor>();
    guesses.forEach((g, r) =>
      [...g].forEach((ch, i) => {
        const c = scored[r][i];
        if (!map.has(ch) || RANK[c] > RANK[map.get(ch)!]) map.set(ch, c);
      }),
    );
    return map;
  }, [guesses, scored]);

  function press(key: string) {
    if (!game.playing) return;
    setMessage(null);
    if (key === "enter") return submit();
    if (key === "back") return setTyped((t) => t.slice(0, -1));
    if (/^[a-z]$/.test(key) && typed.length < length) setTyped((t) => t + key);
  }

  function submit() {
    if (typed.length < length) return reject(`Needs ${length} letters.`);
    if (!words.has(typed)) return reject("Not in the word list.");
    const state = { guesses: [...guesses, typed] };
    setTyped("");
    if (missingWordOutcome(puzzle, state) === "playing") game.update(state);
    else void game.finish(state);
  }

  function reject(text: string) {
    setMessage(text);
    setShakeRow((n) => n + 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") press("enter");
      else if (e.key === "Backspace") press("back");
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const hidden = new Set(puzzle.hidden);
  const resultShown = useResultShown(game.playing, game.state.gaveUp, 1400);
  const left = MISSING_WORD_GUESSES - guesses.length;

  // The verse with the hidden word as empty slots, or (once over) marked in.
  const verse = (over: boolean, won: boolean) =>
    puzzle.tokens.map((t, i) => (
      <span key={i}>
        {t.pre}
        {hidden.has(i) ? (
          over ? (
            <mark
              className={cn(
                "rounded px-1 font-medium",
                won
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
              )}
            >
              {t.word}
            </mark>
          ) : (
            <span className="mx-0.5 inline-flex translate-y-0.5 gap-0.5 align-baseline" aria-label="hidden word">
              {Array.from({ length }, (_, k) => (
                <span key={k} className="inline-block h-5 w-3.5 rounded-sm border-b-2 border-primary/60 bg-primary/10" />
              ))}
            </span>
          )
        ) : (
          t.word
        )}
        {t.post}
      </span>
    ));

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameTitle name="Missing Word" />
        <GameResult
          won={won}
          headline={won ? "You found it" : "Not this time"}
          result={won ? `${guesses.length} of ${MISSING_WORD_GUESSES} guesses` : `The word was “${puzzle.answer}”`}
          next={next}
        >
          {scored.length > 0 && (
            <div className="mb-4 flex flex-col items-center gap-1" aria-hidden>
              {scored.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((c, i) => (
                    <span key={i} className={cn("size-4 rounded-[3px]", DOT[c])} />
                  ))}
                </div>
              ))}
            </div>
          )}
          <VerseCard reference={puzzle.reference} translation={puzzle.translation}>
            {verse(true, won)}
          </VerseCard>
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Missing Word" />

      <VerseCard reference={puzzle.reference} translation={puzzle.translation} className="p-4 [&>div]:text-base [&>div]:leading-relaxed">
        {verse(!game.playing, game.status === "won")}
      </VerseCard>

      <div className="mx-auto mt-4 grid gap-1.5" style={{ gridTemplateRows: `repeat(${MISSING_WORD_GUESSES}, 1fr)` }}>
        {Array.from({ length: MISSING_WORD_GUESSES }, (_, r) => {
          const guess = guesses[r];
          const current = r === guesses.length && game.playing;
          const letters = guess ?? (current ? typed : "");
          return (
            <div
              key={current ? `row-${r}-${shakeRow}` : `row-${r}`}
              className={cn("flex gap-1.5", current && shakeRow > 0 && message && "animate-shake")}
            >
              {Array.from({ length }, (_, c) => {
                const ch = letters[c];
                const color = guess ? scored[r][c] : null;
                return (
                  <span
                    key={c}
                    style={guess ? { animationDelay: `${c * 90}ms` } : undefined}
                    className={cn(
                      "flex size-[clamp(2rem,4.4dvh,3rem)] items-center justify-center rounded-lg border-2 text-lg font-semibold uppercase",
                      color
                        ? cn(TILE[color], "animate-flip")
                        : ch
                          ? "animate-pop border-foreground/40"
                          : current
                            ? "border-primary/30"
                            : "border-border",
                    )}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      <ActionBar
        left={<span aria-live="polite" className={cn(message && "font-medium text-foreground")}>{message ?? countText(left, "guess", "guesses") + " left"}</span>}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ guesses, gaveUp: true })}
      >
        <div className="flex flex-col gap-1.5 select-none" aria-label="Keyboard">
          {ROWS.map((row, r) => (
            <div key={row} className="flex justify-center gap-1">
              {r === 2 && (
                <Key onPress={() => press("enter")} wide>
                  Enter
                </Key>
              )}
              {[...row].map((k) => (
                <Key key={k} onPress={() => press(k)} color={keyColors.get(normalizeWord(k))}>
                  {k}
                </Key>
              ))}
              {r === 2 && (
                <Key onPress={() => press("back")} wide label="Delete">
                  <Delete className="size-5" aria-hidden />
                </Key>
              )}
            </div>
          ))}
        </div>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}

function Key({
  children,
  onPress,
  color,
  wide,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  color?: TileColor;
  wide?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={cn(
        "flex h-[clamp(2.5rem,5.2dvh,3rem)] items-center justify-center rounded-lg text-sm font-semibold uppercase transition-[background-color,scale] active:scale-95",
        wide ? "min-w-14 px-2 text-xs" : "w-[8.5%] min-w-7 max-w-10",
        color ? TILE[color] : "bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}
