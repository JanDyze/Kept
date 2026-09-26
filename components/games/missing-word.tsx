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
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const TILE: Record<TileColor, string> = {
  correct: "border-emerald-600 bg-emerald-600 text-white",
  present: "border-amber-500 bg-amber-500 text-white",
  absent: "border-stone-400 bg-stone-400 text-white",
};
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

  const won = game.status === "won";
  const hidden = new Set(puzzle.hidden);

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Missing Word" detail={`${puzzle.reference} · ${puzzle.translation}`} />

      <p className="font-serif text-lg leading-relaxed">
        {puzzle.tokens.map((t, i) => (
          <span key={i}>
            {t.pre}
            {hidden.has(i) ? (
              game.playing ? (
                <span className="mx-0.5 inline-flex translate-y-0.5 gap-0.5 align-baseline" aria-label="hidden word">
                  {Array.from({ length }, (_, k) => (
                    <span key={k} className="inline-block h-5 w-3.5 rounded-sm border-b-2 border-primary/60 bg-primary/10" />
                  ))}
                </span>
              ) : (
                <mark className={cn("rounded px-0.5", won ? "bg-emerald-100 dark:bg-emerald-900/60" : "bg-amber-100 dark:bg-amber-900/60")}>{t.word}</mark>
              )
            ) : (
              t.word
            )}
            {t.post}
          </span>
        ))}
      </p>

      <div className="mx-auto mt-6 grid gap-1.5" style={{ gridTemplateRows: `repeat(${MISSING_WORD_GUESSES}, 1fr)` }}>
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
                      "flex size-11 items-center justify-center rounded-md border-2 text-xl font-semibold uppercase sm:size-12",
                      color ? cn(TILE[color], "animate-flip") : ch ? "animate-pop border-foreground/40" : "border-border",
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

      <p className="mt-3 min-h-5 text-center text-sm text-muted-foreground" aria-live="polite">
        {message}
      </p>

      {game.playing ? (
        <>
          <div className="mt-2 flex flex-col gap-1.5 select-none" aria-label="Keyboard">
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
          <GiveUp
            onConfirm={() => void game.finish({ guesses, gaveUp: true })}
          />
        </>
      ) : (
        <GameOver
          won={won}
          headline={won ? "You found it" : "Not this time"}
          result={won ? `${guesses.length} of ${MISSING_WORD_GUESSES} guesses` : `The word was “${puzzle.answer}”.`}
          verses={[{ reference: puzzle.reference, translation: puzzle.translation, text: puzzle.tokens.map((t) => t.pre + t.word + t.post).join("") }]}
          next={next}
        />
      )}
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
        "flex h-12 items-center justify-center rounded-md text-sm font-semibold uppercase transition-colors active:scale-95",
        wide ? "min-w-14 px-2 text-xs" : "w-[8.5%] min-w-7 max-w-10",
        color ? TILE[color] : "bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}
