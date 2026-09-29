"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";
import { grade, RECITE_TRIES, reciteOutcome, type ReciteGame, type RecitePuzzle, type ReciteState } from "@/lib/games/recite";
import { gameScore } from "@/lib/games/summary";
import { cn } from "@/lib/utils";
import { ActionBar, GameError, GameResult, KeyboardFit, Segments, useResultShown, VerseCard } from "./game-parts";
import { useGame, type GameStatus } from "./use-game";

type Props = {
  id: string;
  puzzle: RecitePuzzle;
  initialState: ReciteState;
  initialStatus: GameStatus;
  next?: { href: string; name: string };
};
type Graded = ReturnType<typeof grade>;

// Shared by both games: the attempts so far, the last one graded, and checking a new one.
function useRecite(kind: ReciteGame, { id, puzzle, initialState, initialStatus }: Props) {
  const game = useGame<ReciteState>(id, { attempts: initialState.attempts ?? [], gaveUp: initialState.gaveUp }, initialStatus);
  const { attempts, gaveUp } = game.state;
  const last = attempts.at(-1);
  const graded = useMemo(() => (last === undefined ? undefined : grade(puzzle.tokens, last, kind === "say_it")), [puzzle, last, kind]);
  const resultShown = useResultShown(game.playing, gaveUp);
  const [misses, setMisses] = useState(0); // bumps on a check that didn't pass, to shake the box

  function check(text: string) {
    const t = text.trim();
    if (!t || !game.playing) return;
    const state = { ...game.state, attempts: [...attempts, t] };
    if (reciteOutcome(kind, puzzle, state) === "playing") {
      game.update(state);
      setMisses((n) => n + 1);
    } else void game.finish(state);
  }
  const giveUp = () => void game.finish({ ...game.state, gaveUp: true });
  return { game, attempts, graded, resultShown, check, giveUp, misses };
}

// The verse with each word right shown and the rest as blanks the length of the word; on the result
// (`reveal`), the words still missed show in the miss color.
function ReciteVerse({ puzzle, graded, reveal }: { puzzle: RecitePuzzle; graded?: Graded; reveal?: boolean }) {
  return (
    <VerseCard reference={puzzle.reference} translation={puzzle.translation}>
      {puzzle.tokens.map((t, i) => {
        const mark = graded?.marks[i];
        return (
          <span key={i}>
            {t.pre}
            {mark === "right" || (reveal && !graded) ? (
              <span className={cn(!reveal && "animate-pop inline-block")}>{t.word}</span>
            ) : reveal ? (
              <span className="font-medium text-(--mark-miss) underline decoration-(--mark-miss)/50 decoration-2 underline-offset-4">
                {t.word}
              </span>
            ) : (
              <span
                aria-label="blank"
                className="inline-block h-[0.9em] translate-y-[0.15em] rounded-sm border-b-2 border-muted-foreground/40 bg-muted/60"
                style={{ width: `${Math.max(1.2, [...t.word].length * 0.5)}em` }}
              />
            )}
            {t.post}
          </span>
        );
      })}
    </VerseCard>
  );
}

function Result({ kind, props, state }: { kind: ReciteGame; props: Props; state: ReturnType<typeof useRecite> }) {
  const { game, graded } = state;
  const won = game.status === "won";
  return (
    <div className="flex flex-1 flex-col">
      <GameResult
        won={won}
        headline={won ? (kind === "type_it" ? "Word for word" : "Well said") : "Here's the verse"}
        score={gameScore({ game: kind, status: game.status, state: game.state, puzzle: props.puzzle })}
        next={props.next}
      >
        <ReciteVerse puzzle={props.puzzle} graded={graded} reveal />
      </GameResult>
      <GameError message={game.error} saving={game.saving} />
    </div>
  );
}

// "Check 2 of 3" and how many words are right so far.
function tallyOf({ attempts, graded, total }: { attempts: string[]; graded?: Graded; total: number }) {
  const right = graded?.marks.filter((m) => m === "right").length ?? 0;
  return {
    left: `Try ${Math.min(attempts.length + 1, RECITE_TRIES)} of ${RECITE_TRIES}`,
    right: `${right} of ${total} words`,
    progress: right / total,
  };
}

function TypeBox({ initial, onCheck, disabled, misses }: { initial: string; onCheck: (text: string) => void; disabled: boolean; misses: number }) {
  const [text, setText] = useState(initial);
  return (
    <div className="flex flex-col gap-2">
      <textarea
        key={misses}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onCheck(text);
          }
        }}
        disabled={disabled}
        rows={3}
        autoCapitalize="sentences"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label="The verse"
        placeholder="Type the verse…"
        className={cn(
          "w-full resize-none rounded-xl border border-input bg-card px-4 py-3 font-serif text-lg leading-snug outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
          misses > 0 && "animate-shake",
        )}
      />
      <button
        type="button"
        disabled={disabled || !text.trim()}
        onClick={() => onCheck(text)}
        className="h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        Check
      </button>
    </div>
  );
}

export function TypeItGame(props: Props) {
  const r = useRecite("type_it", props);
  const { game, attempts, graded } = r;
  if (r.resultShown) return <Result kind="type_it" props={props} state={r} />;
  const tally = tallyOf({ attempts, graded, total: props.puzzle.tokens.length });

  return (
    <KeyboardFit>
      <Segments parts={[tally.progress]} />
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl">
        <ReciteVerse puzzle={props.puzzle} graded={graded} />
      </div>
      <ActionBar left={tally.left} right={tally.right} disabled={!game.playing} onGiveUp={r.giveUp}>
        <TypeBox initial={attempts.at(-1) ?? ""} onCheck={r.check} disabled={!game.playing} misses={r.misses} />
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </KeyboardFit>
  );
}

// ---------- Say it ----------

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionClass = new () => Recognition;

function recognitionClass() {
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return window.isSecureContext ? (w.SpeechRecognition ?? w.webkitSpeechRecognition) : undefined;
}
const noop = () => () => {};
// Whether this browser can listen: null while rendering on the server.
function useCanListen() {
  return useSyncExternalStore(noop, () => Boolean(recognitionClass()), () => null);
}

const MIC_ERRORS: Record<string, string> = {
  "not-allowed": "Allow the microphone to play.",
  "service-not-allowed": "Allow the microphone to play.",
  "no-speech": "Didn't hear anything. Try again.",
  "audio-capture": "No microphone found.",
};

export function SayItGame(props: Props) {
  const r = useRecite("say_it", props);
  const { game, attempts, graded } = r;
  const canListen = useCanListen();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const heardRef = useRef("");
  const done = useRef(false); // the Done tap: end the try
  const failed = useRef(false);
  const check = useRef(r.check);
  useEffect(() => {
    check.current = r.check;
  });
  useEffect(
    // Leaving mid-recitation drops it rather than counting it as a try.
    () => () => {
      if (!rec.current) return;
      rec.current.onend = null;
      rec.current.abort();
    },
    [],
  );

  // While listening, the words said right so far fill in as they're heard.
  const live = useMemo(() => (listening && heard ? grade(props.puzzle.tokens, heard, true) : undefined), [listening, heard, props.puzzle]);

  function start() {
    const Recognition = recognitionClass();
    if (!Recognition || !game.playing) return;
    const recognition = new Recognition();
    recognition.lang = props.puzzle.translation === "MBBTAG" ? "fil-PH" : "en-US";
    // Not continuous: on Android Chrome and iOS Safari each continuous result repeats the words before
    // it, so "hello" came out "hello hello". One phrase per session instead, and pausing to remember
    // the next line starts a new one, keeping what was heard (`before`). Only the Done tap or an
    // error ends the try.
    recognition.continuous = false;
    recognition.interimResults = true;
    let before = "";
    let restarts = 0;
    recognition.onresult = (e) => {
      const said = e.results[e.results.length - 1]?.[0].transcript ?? "";
      const text = [before, said].join(" ").trim();
      heardRef.current = text;
      setHeard(text);
    };
    recognition.onerror = (e) => {
      if (e.error === "no-speech" && heardRef.current) return; // a pause after speaking: keep going
      failed.current = true;
      setMicError(MIC_ERRORS[e.error] ?? "Couldn't listen. Try again.");
    };
    recognition.onend = () => {
      if (!done.current && !failed.current && restarts++ < 100) {
        before = heardRef.current;
        try {
          recognition.start();
          return;
        } catch {}
      }
      setListening(false);
      rec.current = null;
      if (heardRef.current.trim()) check.current(heardRef.current);
      heardRef.current = "";
      setHeard("");
    };
    heardRef.current = "";
    done.current = false;
    failed.current = false;
    setHeard("");
    setMicError(null);
    rec.current = recognition;
    recognition.start();
    setListening(true);
  }

  function finishSaying() {
    done.current = true;
    rec.current?.stop();
  }

  if (r.resultShown) return <Result kind="say_it" props={props} state={r} />;
  const tally = tallyOf({ attempts, graded: live ?? graded, total: props.puzzle.tokens.length });

  return (
    <KeyboardFit>
      <Segments parts={[tally.progress]} />
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl">
        <ReciteVerse puzzle={props.puzzle} graded={live ?? graded} />
      </div>
      <ActionBar left={tally.left} right={tally.right} disabled={!game.playing || listening} onGiveUp={r.giveUp}>
        {canListen === false ? (
          <>
            <p className="mb-2 text-sm text-muted-foreground">This browser can&apos;t listen, so type it instead.</p>
            <TypeBox initial={attempts.at(-1) ?? ""} onCheck={r.check} disabled={!game.playing} misses={r.misses} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <p
              aria-live="polite"
              className={cn(
                "line-clamp-2 min-h-10 text-center text-sm",
                micError ? "text-destructive" : "font-serif text-muted-foreground italic",
              )}
            >
              {micError ?? heard}
            </p>
            <button
              type="button"
              disabled={!game.playing || canListen === null}
              onClick={() => (listening ? finishSaying() : start())}
              aria-label={listening ? "Done" : "Start reciting"}
              aria-pressed={listening}
              className={cn(
                "relative flex size-18 items-center justify-center rounded-full text-primary-foreground transition-[transform,background-color] active:scale-95 disabled:opacity-40",
                listening ? "bg-(--mark-miss)" : "bg-primary",
                r.misses > 0 && !listening && "animate-shake",
              )}
              key={r.misses}
            >
              {listening && <span className="absolute inset-0 animate-ping rounded-full bg-(--mark-miss)/40" aria-hidden />}
              {listening ? <Square className="relative size-6 fill-current" aria-hidden /> : <Mic className="size-8" aria-hidden />}
            </button>
          </div>
        )}
      </ActionBar>
      <GameError message={game.error} saving={game.saving} />
    </KeyboardFit>
  );
}
