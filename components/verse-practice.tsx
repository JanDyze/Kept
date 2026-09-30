"use client";

import { createContext, useContext, useRef, useState, useSyncExternalStore } from "react";
import { BookText, Eye, EyeOff, RotateCcw } from "lucide-react";
import { tokenize } from "@/lib/games/words";
import { cn } from "@/lib/utils";

// Practising on a verse's page: read it, cover its words (tap one to peek), flip it so only the
// reference shows (tap to turn it over), or hide the reference to recall where it's from. The mode sticks
// for the session, so swiping through My verses keeps practising the same way.
export type PracticeMode = "read" | "words" | "flip" | "reference";

const MODES: { mode: PracticeMode; label: string; Icon: typeof Eye }[] = [
  { mode: "read", label: "Read", Icon: Eye },
  { mode: "words", label: "Blanks", Icon: EyeOff },
  { mode: "flip", label: "Flip", Icon: RotateCcw },
  { mode: "reference", label: "Hide ref", Icon: BookText },
];

const KEY = "kept:practice";
const CHANGE = "kept-practice";

function readMode(): PracticeMode {
  try {
    const m = sessionStorage.getItem(KEY);
    return MODES.some((x) => x.mode === m) ? (m as PracticeMode) : "read";
  } catch {
    return "read";
  }
}

function saveMode(mode: PracticeMode) {
  try {
    sessionStorage.setItem(KEY, mode);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

type Practice = {
  mode: PracticeMode;
  setMode: (m: PracticeMode) => void;
  shown: boolean; // the flipped card, or the hidden reference, turned over
  setShown: (v: boolean) => void;
  turning: boolean; // mid-flip
  flip: () => void;
  peeked: Set<number>; // hidden words tapped open
  peek: (i: number) => void;
};

const FLIP_MS = 520;

const Ctx = createContext<Practice | null>(null);

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => "read" as const);
  const [shown, setShown] = useState(false);
  const [peeked, setPeeked] = useState<Set<number>>(() => new Set());
  const [turning, setTurning] = useState(false);
  const timers = useRef<number[]>([]);
  // The card turns edge-on, swaps faces there, and turns back (FLIP_MS in globals.css' flip-y).
  const flip = () => {
    if (turning) return;
    setTurning(true);
    timers.current = [
      window.setTimeout(() => setShown((v) => !v), FLIP_MS / 2),
      window.setTimeout(() => setTurning(false), FLIP_MS),
    ];
  };
  const setMode = (m: PracticeMode) => {
    timers.current.forEach(clearTimeout);
    setTurning(false);
    setShown(false);
    setPeeked(new Set());
    saveMode(m);
  };
  const peek = (i: number) =>
    setPeeked((p) => {
      const next = new Set(p);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return <Ctx value={{ mode, setMode, shown, setShown, turning, flip, peeked, peek }}>{children}</Ctx>;
}

// The mode switch, under the verse.
export function PracticeToggle({ className }: { className?: string }) {
  const p = useContext(Ctx);
  if (!p) return null;
  return (
    <div role="radiogroup" aria-label="Practice" className={cn("grid grid-cols-4 gap-1 rounded-xl bg-muted p-1", className)}>
      {MODES.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={p.mode === mode}
          onClick={() => p.setMode(mode)}
          className={cn(
            "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 text-xs font-medium transition-[background-color,color,box-shadow] sm:text-sm",
            p.mode === mode ? "bg-background text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

// A solid cover over a word or reference, fitted to the letters and keeping their place in the line.
function Cover({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer rounded-[0.2em] bg-current box-decoration-clone opacity-85 transition-opacity select-none hover:opacity-70"
    >
      <span className="invisible">{children}</span>
    </span>
  );
}

// A word or reference uncovered: tap to cover it again.
function Uncovered({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="animate-fade-in cursor-pointer"
    >
      {children}
    </span>
  );
}

// In Flip, the whole verse turns over sideways when tapped: its back shows only the reference.
export function PracticeCard({ children }: { children: React.ReactNode }) {
  const p = useContext(Ctx);
  if (!p || p.mode !== "flip") return <>{children}</>;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={p.shown ? "Turn the verse face down" : "Turn the verse over"}
      onClick={p.flip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          p.flip();
        }
      }}
      className={cn("cursor-pointer select-none", p.turning && "animate-flip-y")}
    >
      {children}
    </div>
  );
}

// The verse's text, as the practice mode shows it.
export function PracticeText({ text }: { text: string }) {
  const p = useContext(Ctx);
  if (!p || p.mode === "read" || p.mode === "reference") return <>{text}</>;

  // Face down: the text keeps its space, so the card doesn't change size as it turns.
  if (p.mode === "flip")
    return p.shown ? (
      <>{text}</>
    ) : (
      <span className="relative block">
        <span className="invisible">{text}</span>
        <span className="absolute inset-0 flex items-center justify-center opacity-35">
          <RotateCcw className="size-8 -scale-x-100" aria-hidden />
        </span>
      </span>
    );

  return (
    <>
      {tokenize(text).map((t, i) => (
        <span key={i}>
          {t.pre}
          {p.peeked.has(i) ? (
            <Uncovered onClick={() => p.peek(i)} label={`${t.word}, tap to cover`}>
              {t.word}
            </Uncovered>
          ) : (
            <Cover onClick={() => p.peek(i)} label="Covered word, tap to show">
              {t.word}
            </Cover>
          )}
          {t.post}
        </span>
      ))}
    </>
  );
}

// The verse's reference, hidden in "Hide ref" until tapped.
export function PracticeReference({ text }: { text: string }) {
  const p = useContext(Ctx);
  if (!p || p.mode !== "reference") return <>{text}</>;
  if (p.shown)
    return (
      <Uncovered onClick={() => p.setShown(false)} label={`${text}, tap to cover`}>
        {text}
      </Uncovered>
    );
  return (
    <Cover onClick={() => p.setShown(true)} label="Covered reference, tap to show">
      {text}
    </Cover>
  );
}
