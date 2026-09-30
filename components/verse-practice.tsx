"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { BookText, Eye, EyeOff, RotateCcw } from "lucide-react";
import { tokenize } from "@/lib/games/words";
import { cn } from "@/lib/utils";

// Practising on a verse's page: read it, hide its words (tap one to peek), flip it so only the
// reference shows (tap to check), or hide the reference to recall where it's from. The mode sticks
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
  shown: boolean; // the flipped text, or the hidden reference, turned over
  setShown: (v: boolean) => void;
  peeked: Set<number>; // hidden words tapped open
  peek: (i: number) => void;
};

const Ctx = createContext<Practice | null>(null);

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => "read" as const);
  const [shown, setShown] = useState(false);
  const [peeked, setPeeked] = useState<Set<number>>(() => new Set());
  const setMode = (m: PracticeMode) => {
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
  return <Ctx value={{ mode, setMode, shown, setShown, peeked, peek }}>{children}</Ctx>;
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
      {p.mode !== "read" && (
        <p className="col-span-4 px-2 pt-1 pb-0.5 text-center text-xs text-muted-foreground">
          {p.mode === "words" && (p.peeked.size ? "Tap a word again to hide it." : "Say it through, tapping a word to peek.")}
          {p.mode === "flip" && (p.shown ? "Tap the verse to flip it back." : "Say it from memory, then tap to check.")}
          {p.mode === "reference" && (p.shown ? "Tap the reference to hide it again." : "Where is it from? Tap to check.")}
        </p>
      )}
    </div>
  );
}

// A bar over a word or reference, keeping its place in the line.
function Blank({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline rounded-[0.25em] bg-current/15 align-baseline transition-colors hover:bg-current/25"
    >
      <span className="invisible">{children}</span>
    </button>
  );
}

// The verse's text, as the practice mode shows it.
export function PracticeText({ text }: { text: string }) {
  const p = useContext(Ctx);
  if (!p || p.mode === "read" || p.mode === "reference") return <>{text}</>;

  if (p.mode === "flip")
    return (
      <button
        type="button"
        onClick={() => p.setShown(!p.shown)}
        aria-label={p.shown ? "Hide the verse" : "Show the verse"}
        className="relative block w-full text-left [font:inherit] [text-align:inherit]"
      >
        <span key={String(p.shown)} className={cn("block animate-flip", !p.shown && "invisible")}>
          {text}
        </span>
        {!p.shown && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-current/25 font-sans text-sm font-medium opacity-70">
            Tap to flip
          </span>
        )}
      </button>
    );

  return (
    <>
      {tokenize(text).map((t, i) => (
        <span key={i}>
          {t.pre}
          {p.peeked.has(i) ? (
            <button type="button" onClick={() => p.peek(i)} className="inline rounded-[0.25em] bg-current/10 [font:inherit]">
              {t.word}
            </button>
          ) : (
            <Blank onClick={() => p.peek(i)} label="Hidden word, tap to show">
              {t.word}
            </Blank>
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
      <button type="button" onClick={() => p.setShown(false)} className="animate-flip inline [font:inherit] [text-align:inherit]">
        {text}
      </button>
    );
  return (
    <Blank onClick={() => p.setShown(true)} label="Hidden reference, tap to show">
      {text}
    </Blank>
  );
}
