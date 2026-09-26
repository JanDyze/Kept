"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  blankOrder,
  isRightWord,
  roundAt,
  roundBank,
  type FillBlanksPuzzle,
  type FillBlanksState,
  type FillBlanksVerse,
} from "@/lib/games/fill-blanks";
import { cn } from "@/lib/utils";
import { ActionBar, countText, DoneBadge, GameError, GameResult, GameTitle, mistakesText, Segments, useResultShown, VerseCard } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

type Blank = ReturnType<typeof blankOrder>[number];

const ROUND_PAUSE_MS = 1100; // a finished verse stays up this long before the next slides in

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
  const { filled, mistakes, gaveUp } = game.state;
  const rounds = puzzle.verses.length;

  // One verse per round. `shown` trails the state for a moment so a finished verse can be seen whole.
  const current = roundAt(puzzle, filled);
  const [shown, setShown] = useState(current);
  useEffect(() => {
    if (shown === current) return;
    const t = setTimeout(() => setShown(current), ROUND_PAUSE_MS);
    return () => clearTimeout(t);
  }, [shown, current]);

  const resultShown = useResultShown(game.playing, gaveUp);

  const verse = puzzle.verses[shown];
  const roundBlanks = useMemo(() => order.filter((b) => b.verseIndex === shown), [order, shown]);
  const roundFirst = order.indexOf(roundBlanks[0]);
  const roundFilled = Math.max(0, Math.min(filled - roundFirst, roundBlanks.length));
  const roundDone = roundFilled === roundBlanks.length;
  const active = order[filled];

  // This round's words minus the ones already placed (one instance each).
  const remaining = useMemo(() => {
    const left = roundBank(puzzle, shown).map((word, index) => ({ word, index }));
    for (const b of roundBlanks.slice(0, roundFilled)) {
      const at = left.findIndex((w) => isRightWord(w.word, b.answer));
      if (at !== -1) left.splice(at, 1);
    }
    return left;
  }, [puzzle, shown, roundBlanks, roundFilled]);

  function choose(word: string, index: number) {
    if (!game.playing || !active || active.verseIndex !== shown) return;
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

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameTitle name="Fill the Blanks" />
        <GameResult
          won={won}
          headline={won ? (totalMistakes === 0 ? "Perfect" : "All filled in") : "Here's the rest"}
          result={won ? `${mistakesText(totalMistakes)} · ${countText(rounds, "verse")}` : "Gave up"}
          next={next}
        >
          <VerseSummary puzzle={puzzle} order={order} state={game.state} />
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Fill the Blanks" detail={rounds > 1 ? `Verse ${shown + 1} of ${rounds}` : undefined} />

      <Segments
        parts={puzzle.verses.map((_, vi) => {
          const blanks = order.filter((b) => b.verseIndex === vi);
          return blanks.filter((b) => order.indexOf(b) < filled).length / blanks.length;
        })}
      />

      <VerseCard
        key={shown}
        reference={verse.reference}
        translation={verse.translation}
        className="animate-rise mt-4"
        aside={roundDone && <DoneBadge />}
      >
        <VerseText verse={verse} verseIndex={shown} order={order} filled={filled} activeAt={game.playing ? filled : -1} />
      </VerseCard>

      <ActionBar
        left={`${roundFilled} of ${roundBlanks.length}`}
        right={mistakesText(totalMistakes)}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ ...game.state, gaveUp: true })}
      >
        <div className="flex min-h-11 flex-wrap gap-2">
          {remaining.map(({ word, index }) => (
            <button
              key={`${shown}-${index}-${wrong?.index === index ? wrong.n : 0}`}
              type="button"
              disabled={roundDone || !game.playing}
              onClick={() => choose(word, index)}
              className={cn(
                "h-11 rounded-xl border bg-card px-4 font-serif text-lg transition-[background-color,opacity,scale] hover:bg-muted active:scale-95 disabled:opacity-40",
                wrong?.index === index && "animate-shake border-destructive/50 text-destructive",
              )}
            >
              {word}
            </button>
          ))}
        </div>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}

// A verse with its blanks: filled ones in the primary color, the one being filled marked, and
// (with `reveal`) the ones never reached shown as answers.
function VerseText({
  verse,
  verseIndex,
  order,
  filled,
  activeAt,
  reveal,
}: {
  verse: FillBlanksVerse;
  verseIndex: number;
  order: Blank[];
  filled: number;
  activeAt: number;
  reveal?: boolean;
}) {
  return verse.tokens.map((t, ti) => {
    const at = order.findIndex((b) => b.verseIndex === verseIndex && b.tokenIndex === ti);
    if (at === -1)
      return (
        <span key={ti}>
          {t.pre}
          {t.word}
          {t.post}
        </span>
      );
    const done = at < filled;
    const shown = done || reveal;
    return (
      <span key={ti}>
        {t.pre}
        <span
          className={cn(
            "inline-block min-w-12 rounded-md px-1 text-center leading-snug transition-colors",
            done
              ? cn("font-medium text-primary", !reveal && "animate-pop")
              : reveal
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                : at === activeAt
                  ? "border-b-2 border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-b-2 border-muted-foreground/40",
          )}
        >
          {shown ? t.word : " "}
        </span>
        {t.post}
      </span>
    );
  });
}

// One row per verse with how it went; tap to see the verse. Verses given up on start open.
function VerseSummary({ puzzle, order, state }: { puzzle: FillBlanksPuzzle; order: Blank[]; state: FillBlanksState }) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {puzzle.verses.map((v, vi) => {
        const lastBlank = order.findLastIndex((b) => b.verseIndex === vi);
        const unfinished = Boolean(state.gaveUp) && state.filled <= lastBlank;
        const m = state.mistakes[vi] ?? 0;
        return (
          <li key={v.verseId}>
            <details className="group" open={unfinished}>
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{v.reference}</span>
                  <span className="block text-xs text-muted-foreground">{v.translation}</span>
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-sm",
                    unfinished ? "text-amber-700 dark:text-amber-300" : m === 0 ? "font-medium text-primary" : "text-muted-foreground",
                  )}
                >
                  {!unfinished && m === 0 && <Check className="size-4" strokeWidth={3} aria-hidden />}
                  {unfinished ? "Revealed" : m === 0 ? "Perfect" : mistakesText(m)}
                </span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-4 pb-4 font-serif text-lg leading-loose">
                <VerseText verse={v} verseIndex={vi} order={order} filled={state.filled} activeAt={-1} reveal />
              </p>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
