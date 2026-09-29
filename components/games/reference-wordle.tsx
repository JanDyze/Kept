"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOKS } from "@/lib/bible/books";
import {
  isValidGuess,
  REFERENCE_GUESSES,
  referenceHint,
  referenceOutcome,
  type Direction,
  type ReferenceGuess,
  type ReferenceWordlePuzzle,
  type ReferenceWordleState,
} from "@/lib/games/reference-wordle";
import { cn } from "@/lib/utils";
import { BookPicker } from "./book-picker";
import { ActionBar, countText, GameError, GameResult, useResultShown, VerseCard } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

export function ReferenceWordleGame({
  id,
  puzzle,
  initialState,
  initialStatus,
  next,
}: {
  id: string;
  puzzle: ReferenceWordlePuzzle;
  initialState: ReferenceWordleState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
}) {
  const game = useGame<ReferenceWordleState>(id, { guesses: initialState.guesses ?? [] }, initialStatus);
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verse, setVerse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const { guesses } = game.state;
  const selected = BOOKS[Number(book) - 1];
  const resultShown = useResultShown(game.playing, game.state.gaveUp, 1100);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const guess = { bookNumber: Number(book), chapter: Number(chapter), verse: Number(verse) };
    if (!selected || !chapter || !verse) return reject("Pick a book, chapter and verse");
    if (!isValidGuess(guess)) {
      return reject(
        guess.chapter > selected.verses.length
          ? `${selected.name} has ${selected.verses.length} chapters`
          : `${selected.name} ${guess.chapter} has ${selected.verses[guess.chapter - 1]} verses`,
      );
    }
    setMessage(null);
    const state = { guesses: [...guesses, guess] };
    // Keep the book: most next guesses refine chapter and verse.
    setChapter("");
    setVerse("");
    if (referenceOutcome(puzzle, state) === "playing") game.update(state);
    else void game.finish(state);
  }

  function reject(text: string) {
    setMessage(text);
    setShake((n) => n + 1);
  }

  if (resultShown) {
    const won = game.status === "won";
    return (
      <div className="flex flex-1 flex-col">
        <GameResult
          won={won}
          headline={won ? "Right on" : "Not this time"}
          result={won ? `${guesses.length} of ${REFERENCE_GUESSES} guesses` : `It was ${puzzle.reference}`}
          next={next}
        >
          <VerseCard reference={puzzle.reference} translation={puzzle.translation} className="[&>div]:text-lg [&>div]:leading-relaxed">
            {puzzle.text}
          </VerseCard>
          {guesses.length > 0 && (
            <ol className="mt-4 flex flex-col gap-1.5">
              {guesses.map((g, i) => (
                <GuessRow key={i} guess={g} puzzle={puzzle} />
              ))}
            </ol>
          )}
        </GameResult>
        <GameError message={game.error} saving={game.saving} />
      </div>
    );
  }

  const chapters = selected?.verses.length;
  const versesInChapter = selected && Number(chapter) >= 1 ? selected.verses[Number(chapter) - 1] : undefined;

  return (
    <div className="flex flex-1 flex-col">

      <VerseCard reference={puzzle.translation} className="[&>div]:text-lg [&>div]:leading-relaxed">
        {puzzle.text}
      </VerseCard>

      <ol className="mt-4 flex flex-col gap-1.5">
        {Array.from({ length: REFERENCE_GUESSES }, (_, i) =>
          guesses[i] ? (
            <GuessRow key={i} guess={guesses[i]} puzzle={puzzle} />
          ) : (
            <li key={i} className={cn("h-11 rounded-xl border border-dashed", i === guesses.length ? "border-primary/40" : "border-border")} />
          ),
        )}
      </ol>

      <ActionBar
        left={<span aria-live="polite" className={cn(message && "font-medium text-foreground")}>{message ?? `${countText(REFERENCE_GUESSES - guesses.length, "guess", "guesses")} left`}</span>}
        disabled={!game.playing}
        onGiveUp={() => void game.finish({ guesses, gaveUp: true })}
      >
        <form key={shake} onSubmit={submit} className={cn("flex flex-col gap-2", shake > 0 && message && "animate-shake")}>
          <BookPicker value={book ? Number(book) : null} disabled={!game.playing} onChange={(n) => setBook(String(n))} />
          <div className="flex gap-2">
            <Input
              id="chapter"
              aria-label="Chapter"
              inputMode="numeric"
              pattern="[0-9]*"
              value={chapter}
              disabled={!game.playing}
              onChange={(e) => setChapter(e.target.value.replace(/\D/g, ""))}
              placeholder={chapters ? `Ch. 1–${chapters}` : "Chapter"}
              className="h-11 min-w-0 flex-1 rounded-xl bg-card text-base"
            />
            <Input
              id="verse"
              aria-label="Verse"
              inputMode="numeric"
              pattern="[0-9]*"
              value={verse}
              disabled={!game.playing}
              onChange={(e) => setVerse(e.target.value.replace(/\D/g, ""))}
              placeholder={versesInChapter ? `V. 1–${versesInChapter}` : "Verse"}
              className="h-11 min-w-0 flex-1 rounded-xl bg-card text-base"
            />
            <Button type="submit" disabled={!game.playing} className="h-11 rounded-xl px-5 text-base">
              Guess
            </Button>
          </div>
        </form>
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}

// A guess as three chips: green when right, arrows toward the answer (up = later / higher).
// A book within three of the answer is amber.
function GuessRow({ guess, puzzle }: { guess: ReferenceGuess; puzzle: ReferenceWordlePuzzle }) {
  const hint = referenceHint(guess, puzzle.answer);
  const bookTone = hint.book === "correct" ? "right" : hint.near ? "close" : "off";
  return (
    <li className="animate-rise flex gap-1.5">
      <Chip
        dir={hint.book}
        tone={bookTone}
        className="min-w-0 flex-1"
        label={`Book ${BOOKS[guess.bookNumber - 1].name}${!hint.sameTestament ? ", other testament" : ""}`}
      >
        <span className="truncate">{BOOKS[guess.bookNumber - 1].name}</span>
        {!hint.sameTestament && <span className="shrink-0 text-[0.65rem] font-normal opacity-80">other T.</span>}
      </Chip>
      <Chip dir={hint.chapter} tone={hint.chapter === "correct" ? "right" : "off"} className="w-16" label={`Chapter ${guess.chapter}`}>
        {guess.chapter}
      </Chip>
      <Chip dir={hint.verse} tone={hint.verse === "correct" ? "right" : "off"} className="w-16" label={`Verse ${guess.verse}`}>
        {guess.verse}
      </Chip>
    </li>
  );
}

function Chip({
  dir,
  tone,
  label,
  className,
  children,
}: {
  dir: Direction | null;
  tone: "right" | "close" | "off";
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const said = dir === null ? "" : dir === "correct" ? ": right" : dir === "higher" ? ": later" : ": earlier";
  return (
    <span
      aria-label={label + said}
      className={cn(
        "flex h-11 items-center justify-center gap-1 rounded-xl px-2.5 text-sm font-semibold",
        tone === "right"
          ? "bg-emerald-600 text-white"
          : tone === "close"
            ? "bg-amber-500 text-white"
            : dir === null
              ? "bg-muted text-muted-foreground"
              : "bg-stone-400 text-white dark:bg-stone-600",
        className,
      )}
    >
      {children}
      {dir === "correct" ? (
        <Check className="size-3.5 shrink-0" strokeWidth={3} aria-hidden />
      ) : dir === "higher" ? (
        <ArrowUp className="size-3.5 shrink-0" strokeWidth={3} aria-hidden />
      ) : dir === "lower" ? (
        <ArrowDown className="size-3.5 shrink-0" strokeWidth={3} aria-hidden />
      ) : null}
    </span>
  );
}
