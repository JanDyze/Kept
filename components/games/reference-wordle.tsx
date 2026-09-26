"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKS } from "@/lib/bible/books";
import {
  formatGuess,
  isValidGuess,
  REFERENCE_GUESSES,
  referenceHint,
  referenceOutcome,
  type Direction,
  type ReferenceWordlePuzzle,
  type ReferenceWordleState,
} from "@/lib/games/reference-wordle";
import { cn } from "@/lib/utils";
import { GameError, GameOver, GameTitle, GiveUp } from "./game-parts";
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const guess = { bookNumber: Number(book), chapter: Number(chapter), verse: Number(verse) };
    if (!selected || !chapter || !verse) return reject("Pick a book, chapter and verse.");
    if (!isValidGuess(guess)) {
      const max = guess.chapter > selected.verses.length ? `${selected.name} has ${selected.verses.length} chapters.` : `${selected.name} ${guess.chapter} has ${selected.verses[guess.chapter - 1]} verses.`;
      return reject(max);
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

  const won = game.status === "won";

  return (
    <div className="flex flex-1 flex-col">
      <GameTitle name="Reference" detail={`Where is this verse? · ${puzzle.translation}`} />

      <blockquote className="rounded-2xl bg-muted/60 p-4 font-serif text-lg leading-relaxed">{puzzle.text}</blockquote>

      <ol className="mt-5 flex flex-col gap-2">
        {guesses.map((g, i) => {
          const hint = referenceHint(g, puzzle.answer);
          return (
            <li key={i} className="animate-rise flex items-center justify-between gap-2 rounded-xl border bg-card p-3">
              <span className="min-w-0 truncate font-medium">{formatGuess(g)}</span>
              <span className="flex shrink-0 gap-1.5">
                <Hint label="Book" dir={hint.book} extra={hint.book !== "correct" ? (hint.near ? "close" : hint.sameTestament ? "same testament" : "other testament") : undefined} />
                <Hint label="Ch" dir={hint.chapter} />
                <Hint label="V" dir={hint.verse} />
              </span>
            </li>
          );
        })}
      </ol>
      {guesses.length > 0 && game.playing && (
        <p className="mt-2 text-xs text-muted-foreground">
          ↑ later book or higher number · ↓ earlier or lower · amber = within 3 books
        </p>
      )}

      {game.playing ? (
        <>
          <form key={shake} onSubmit={submit} className={cn("mt-5 flex flex-col gap-3", shake > 0 && message && "animate-shake")}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="book">Book</Label>
              <select
                id="book"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="h-11 rounded-lg border border-input bg-background px-3 text-base"
              >
                <option value="">Choose a book</option>
                <optgroup label="Old Testament">
                  {BOOKS.slice(0, 39).map((b) => (
                    <option key={b.number} value={b.number}>
                      {b.name}
                      {b.tl !== b.name ? ` · ${b.tl}` : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="New Testament">
                  {BOOKS.slice(39).map((b) => (
                    <option key={b.number} value={b.number}>
                      {b.name}
                      {b.tl !== b.name ? ` · ${b.tl}` : ""}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="chapter">Chapter</Label>
                <Input
                  id="chapter"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value.replace(/\D/g, ""))}
                  placeholder={selected ? `1–${selected.verses.length}` : ""}
                  className="h-11 text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="verse">Verse</Label>
                <Input
                  id="verse"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={verse}
                  onChange={(e) => setVerse(e.target.value.replace(/\D/g, ""))}
                  placeholder={selected && Number(chapter) >= 1 && selected.verses[Number(chapter) - 1] ? `1–${selected.verses[Number(chapter) - 1]}` : ""}
                  className="h-11 text-base"
                />
              </div>
            </div>
            <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
              {message ?? `${REFERENCE_GUESSES - guesses.length} ${REFERENCE_GUESSES - guesses.length === 1 ? "guess" : "guesses"} left`}
            </p>
            <Button type="submit" className="h-12 text-base">
              Guess
            </Button>
          </form>
          <GiveUp onConfirm={() => void game.finish({ guesses, gaveUp: true })} />
        </>
      ) : (
        <GameOver
          won={won}
          headline={won ? "Right on" : "Not this time"}
          result={won ? `${guesses.length} of ${REFERENCE_GUESSES} guesses` : `It was ${puzzle.reference}.`}
          verses={[{ reference: puzzle.reference, translation: puzzle.translation, text: puzzle.text }]}
          next={next}
        />
      )}
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}

function Hint({ label, dir, extra }: { label: string; dir: Direction | null; extra?: string }) {
  const text = dir === null ? "not yet" : dir === "correct" ? "right" : dir === "higher" ? "later" : "earlier";
  return (
    <span
      title={extra}
      aria-label={`${label}: ${text}${extra ? `, ${extra}` : ""}`}
      className={cn(
        "flex h-9 min-w-12 flex-col items-center justify-center rounded-lg px-1.5 text-[0.65rem] font-medium leading-tight",
        dir === "correct"
          ? "bg-emerald-600 text-white"
          : dir === null
            ? "bg-muted text-muted-foreground"
            : extra === "close"
              ? "bg-amber-500 text-white"
              : "bg-stone-400 text-white",
      )}
    >
      <span className="flex items-center gap-0.5">
        {label}
        {dir === "correct" ? (
          <Check className="size-3" aria-hidden />
        ) : dir === "higher" ? (
          <ArrowUp className="size-3" aria-hidden />
        ) : dir === "lower" ? (
          <ArrowDown className="size-3" aria-hidden />
        ) : null}
      </span>
      {extra && extra !== "close" && <span className="opacity-90">{extra === "same testament" ? "same T." : "other T."}</span>}
      {extra === "close" && <span>close</span>}
    </span>
  );
}
