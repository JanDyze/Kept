"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { BookText, Brain, EyeOff, RotateCcw, Shuffle, X } from "lucide-react";
import { seededRandom, shuffle } from "@/lib/games/random";
import { tokenize } from "@/lib/games/words";
import { SWIPED_EVENT } from "@/components/card-swiper";
import { verseAction, verseActionPanel } from "@/components/verse-action";
import { cn } from "@/lib/utils";

// Practising on a verse's page, only once asked for (Practice): cover its words, a few or all
// (tap one to peek), flip it over like a card so only the reference shows, or cover the reference
// to recall where it's from. A verse opened from a list starts plain; swiping to the next one keeps
// practising the same way.
export type PracticeMode = "read" | "words" | "flip" | "reference";
type Level = 1 | 2 | 3; // a third, two thirds or all of the words covered

const MODES: { mode: Exclude<PracticeMode, "read">; label: string; name: string; Icon: typeof EyeOff }[] = [
  { mode: "words", label: "Words", name: "Cover the words", Icon: EyeOff },
  { mode: "flip", label: "Flip", name: "Flip to the reference", Icon: RotateCcw },
  { mode: "reference", label: "Ref", name: "Cover the reference", Icon: BookText },
];
const LEVELS: { level: Level; label: string }[] = [
  { level: 1, label: "Some" },
  { level: 2, label: "More" },
  { level: 3, label: "All" },
];

type Practice = {
  carried: boolean; // picked up from the verse swiped away: already on screen, so no entrance
  open: boolean;
  setOpen: (v: boolean) => void;
  mode: PracticeMode;
  setMode: (m: PracticeMode) => void;
  faceDown: boolean; // Flip: showing the reference side
  turn: () => void;
  refShown: boolean; // Cover ref: tapped open
  setRefShown: (v: boolean) => void;
  level: Level;
  setLevel: (l: Level) => void;
  seed: number; // which words a partial cover picks; a new one reshuffles
  reshuffle: () => void;
  peeked: Set<number>; // covered words tapped open
  peek: (i: number) => void;
};

const Ctx = createContext<Practice | null>(null);

// How the verse being swiped away was practised, for the next one to pick up as it mounts.
type Carry = { open: boolean; mode: PracticeMode; level: Level };
let carry: Carry | null = null;

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [start] = useState(() => carry);
  const [open, setOpenState] = useState(start?.open ?? false);
  const [mode, setModeState] = useState<PracticeMode>(start?.mode ?? "read");
  const [faceDown, setFaceDown] = useState(start?.mode === "flip");
  const [refShown, setRefShown] = useState(false);
  const [level, setLevelState] = useState<Level>(start?.level ?? 1);
  const [seed, setSeed] = useState(() => (start?.mode === "words" ? Math.random() : 0));
  const [peeked, setPeeked] = useState<Set<number>>(() => new Set());

  const now = useRef<Carry>({ open, mode, level });
  useEffect(() => {
    now.current = { open, mode, level };
  });
  useEffect(() => {
    carry = null;
    const onSwiped = () => {
      carry = now.current;
    };
    window.addEventListener(SWIPED_EVENT, onSwiped);
    return () => window.removeEventListener(SWIPED_EVENT, onSwiped);
  }, []);

  const setMode = (m: PracticeMode) => {
    setPeeked(new Set());
    setRefShown(false);
    setFaceDown(m === "flip");
    if (m === "words") setSeed(Math.random());
    setModeState(m);
  };
  const setOpen = (v: boolean) => {
    setOpenState(v);
    if (!v) setMode("read");
  };
  const setLevel = (l: Level) => {
    setPeeked(new Set());
    setLevelState(l);
  };
  const reshuffle = () => {
    setPeeked(new Set());
    setSeed(Math.random());
  };
  const peek = (i: number) =>
    setPeeked((p) => {
      const next = new Set(p);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Ctx
      value={{
        carried: start !== null,
        open,
        setOpen,
        mode,
        setMode,
        faceDown,
        turn: () => setFaceDown((v) => !v),
        refShown,
        setRefShown,
        level,
        setLevel,
        seed,
        reshuffle,
        peeked,
        peek,
      }}
    >
      {children}
    </Ctx>
  );
}

// Practice, in the verse page's row of actions.
export function PracticeButton() {
  const p = useContext(Ctx);
  if (!p) return null;
  return (
    <button type="button" aria-expanded={p.open} onClick={() => p.setOpen(!p.open)} className={verseAction(p.open)}>
      <Brain className="size-5" aria-hidden /> Practice
    </button>
  );
}

const segment = (on: boolean) =>
  cn(
    "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-[background-color,color,box-shadow]",
    on ? "bg-background text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-muted-foreground hover:text-foreground",
  );

// The ways to practise, once Practice is on, under the row of actions. Nothing is covered until
// one is picked.
export function PracticeBar() {
  const p = useContext(Ctx);
  if (!p?.open) return null;
  return (
    <div className={cn(!p.carried && "animate-rise", "flex flex-col gap-2", verseActionPanel)}>
      <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
        <div role="radiogroup" aria-label="Practice" className="grid flex-1 grid-cols-3 gap-1">
          {MODES.map(({ mode, label, name, Icon }) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-label={name}
              aria-checked={p.mode === mode}
              onClick={() => p.setMode(p.mode === mode ? "read" : mode)}
              className={segment(p.mode === mode)}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => p.setOpen(false)}
          aria-label="Stop practising"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {p.mode === "words" && (
        <div className={cn(!p.carried && "animate-rise", "flex items-center gap-1 rounded-xl bg-muted p-1")}>
          <div role="radiogroup" aria-label="How much to cover" className="grid flex-1 grid-cols-3 gap-1">
            {LEVELS.map(({ level, label }) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={p.level === level}
                onClick={() => p.setLevel(level)}
                className={segment(p.level === level)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={p.reshuffle}
            aria-label={p.level === 3 ? "Cover them all again" : "Cover different words"}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Shuffle className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function Tappable({
  onTap,
  label,
  className,
  style,
  children,
}: {
  onTap: () => void;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      className={cn("cursor-pointer", className)}
      style={style}
    >
      {children}
    </span>
  );
}

// A solid cover over a word or reference, fitted to the letters and keeping their place in the
// line. `delay` staggers covers as they're laid down.
function Cover({ children, onTap, label, delay = 0 }: { children: React.ReactNode; onTap: () => void; label: string; delay?: number }) {
  return (
    <Tappable
      onTap={onTap}
      label={label}
      className="animate-cover rounded-[0.2em] bg-current box-decoration-clone select-none hover:opacity-75"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="invisible">{children}</span>
    </Tappable>
  );
}

// The verse's text, with words covered in Cover words.
export function PracticeText({ text }: { text: string }) {
  const p = useContext(Ctx);
  if (p?.mode !== "words") return <>{text}</>;

  const tokens = tokenize(text);
  const order = shuffle(
    tokens.map((_, i) => i),
    seededRandom(`${p.seed}`),
  );
  const count = p.level === 3 ? tokens.length : Math.ceil((tokens.length * p.level) / 3);
  const covered = new Set(order.slice(0, count));
  let n = 0;

  return (
    <>
      {tokens.map((t, i) => (
        <span key={i}>
          {t.pre}
          {covered.has(i) && !p.peeked.has(i) ? (
            <Cover key={`${p.seed}-${p.level}`} onTap={() => p.peek(i)} label="Covered word, tap to show" delay={Math.min(n++, 40) * 12}>
              {t.word}
            </Cover>
          ) : covered.has(i) ? (
            <Tappable
              onTap={() => p.peek(i)}
              label={`${t.word}, tap to cover`}
              className="animate-fade-in underline decoration-current/30 decoration-2 underline-offset-4"
            >
              {t.word}
            </Tappable>
          ) : (
            t.word
          )}
          {t.post}
        </span>
      ))}
    </>
  );
}

// The verse's reference, covered in Cover ref until tapped.
export function PracticeReference({ text }: { text: string }) {
  const p = useContext(Ctx);
  if (p?.mode !== "reference") return <>{text}</>;
  if (p.refShown)
    return (
      <Tappable onTap={() => p.setRefShown(false)} label={`${text}, tap to cover`} className="animate-fade-in">
        {text}
      </Tappable>
    );
  return (
    <Cover onTap={() => p.setRefShown(true)} label="Covered reference, tap to show">
      {text}
    </Cover>
  );
}

// The verse as a card with two sides: in Flip it turns over as one piece to `back` (the reference
// alone), and back again on a tap. `plain` gives a verse without a card a card's surface while
// flipping, so there's something to turn.
export function PracticeCard({ back, plain, children }: { back: React.ReactNode; plain?: boolean; children: React.ReactNode }) {
  const p = useContext(Ctx);
  const flipping = p?.mode === "flip";
  const faceDown = Boolean(flipping && p?.faceDown);
  const turn = () => p?.turn();
  return (
    <div className="[perspective:1600px]">
      <div
        role={flipping ? "button" : undefined}
        tabIndex={flipping ? 0 : undefined}
        aria-label={flipping ? (faceDown ? "Turn the verse over" : "Turn it back to the reference") : undefined}
        onClick={flipping ? turn : undefined}
        onKeyDown={(e) => {
          if (flipping && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            turn();
          }
        }}
        className={cn(
          "relative transition-transform duration-700 ease-[cubic-bezier(0.3,0.7,0.2,1)] [transform-style:preserve-3d] motion-reduce:duration-0",
          flipping && "cursor-pointer select-none",
        )}
        style={{ transform: faceDown ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          aria-hidden={faceDown || undefined}
          className={cn(
            "[-webkit-backface-visibility:hidden] [backface-visibility:hidden]",
            plain && "rounded-2xl border border-transparent transition-[background-color,border-color,padding] duration-300",
            plain && flipping && "border-border bg-card p-5",
          )}
        >
          {children}
        </div>
        <div
          aria-hidden={!faceDown || undefined}
          className="absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          {back}
        </div>
      </div>
    </div>
  );
}
