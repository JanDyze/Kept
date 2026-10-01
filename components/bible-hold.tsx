"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { BOOKS, bookSlug, type Book } from "@/lib/bible/books";
import { cn } from "@/lib/utils";

const HOLD_MS = 380;
const SLOP = 10;
const EDGE = 64; // px from a list's top or bottom where a held finger scrolls it

// Short names that fit a 6-across grid.
const SHORT = [
  "Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", "1 Sam", "2 Sam", "1 Kgs", "2 Kgs", "1 Chr", "2 Chr",
  "Ezra", "Neh", "Esth", "Job", "Ps", "Prov", "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek", "Dan", "Hos", "Joel",
  "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal", "Matt", "Mark", "Luke", "John", "Acts",
  "Rom", "1 Cor", "2 Cor", "Gal", "Eph", "Phil", "Col", "1 Th", "2 Th", "1 Tim", "2 Tim", "Titus", "Phlm", "Heb",
  "Jas", "1 Pet", "2 Pet", "1 Jn", "2 Jn", "3 Jn", "Jude", "Rev",
];

type Stage = { book: null } | { book: Book; chapter: null } | { book: Book; chapter: number };

// Home's Bible card: a tap opens the Bible; holding it opens a picker under the finger. Slide to
// a book and let go, then a chapter, then a verse, and the chapter opens at that verse. The list
// scrolls when the finger nears its edge, and every step can be tapped instead.
export function BibleHold({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timer = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const [pressing, setPressing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      className="relative flex select-none [-webkit-touch-callout:none] *:flex-1"
      style={{ transform: pressing ? "scale(0.97)" : undefined, transition: "transform 300ms ease-out" }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        held.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        setPressing(true);
        timer.current = window.setTimeout(() => {
          held.current = true;
          setPressing(false);
          navigator.vibrate?.(8);
          setOpen(true);
        }, HOLD_MS);
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!held.current && s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) {
          clearTimeout(timer.current);
          setPressing(false);
          start.current = null;
        }
      }}
      onPointerUp={() => {
        clearTimeout(timer.current);
        setPressing(false);
        start.current = null;
      }}
      onPointerCancel={() => {
        if (held.current) return;
        clearTimeout(timer.current);
        setPressing(false);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        held.current = true;
        setOpen(true);
      }}
      onClickCapture={(e) => {
        if (!held.current) return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
      {open && (
        <Picker
          tracking
          onClose={() => {
            setOpen(false);
            window.setTimeout(() => (held.current = false), 400);
          }}
          onGo={(href) => {
            setOpen(false);
            held.current = false;
            router.push(href, { transitionTypes: ["nav-forward"] });
          }}
        />
      )}
    </div>
  );
}

function Picker({ tracking: initiallyTracking, onClose, onGo }: { tracking: boolean; onClose: () => void; onGo: (href: string) => void }) {
  const [stage, setStage] = useState<Stage>({ book: null });
  const [hover, setHover] = useState<string | null>(null);
  const tracking = useRef(initiallyTracking);
  const list = useRef<HTMLDivElement>(null);
  const finger = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef(0);
  // A release picks; the click it fires next lands on the next step's grid, so it's ignored.
  const quietUntil = useRef(0);

  const items: { key: string; label: string; detail: string }[] =
    stage.book === null
      ? BOOKS.map((b, i) => ({ key: String(b.number), label: SHORT[i], detail: `${b.name} · ${b.verses.length} ${b.verses.length === 1 ? "chapter" : "chapters"}` }))
      : stage.chapter === null
        ? stage.book.verses.map((n, i) => ({ key: String(i + 1), label: String(i + 1), detail: `${stage.book.name} ${i + 1} · ${n} verses` }))
        : Array.from({ length: stage.book.verses[stage.chapter - 1] }, (_, i) => ({
            key: String(i + 1),
            label: String(i + 1),
            detail: `${stage.book.name} ${stage.chapter}:${i + 1}`,
          }));

  const choose = useCallback(
    (key: string) => {
      setHover(null);
      if (stage.book === null) {
        const book = BOOKS[Number(key) - 1];
        // One-chapter books go straight to their verses.
        setStage(book.verses.length === 1 ? { book, chapter: 1 } : { book, chapter: null });
      } else if (stage.chapter === null) setStage({ book: stage.book, chapter: Number(key) });
      else onGo(`/bible/${bookSlug(stage.book)}/${stage.chapter}#v${key}`);
      list.current?.scrollTo({ top: 0 });
    },
    [stage, onGo],
  );

  const back = () => {
    setHover(null);
    if (stage.book === null) onClose();
    else if (stage.chapter === null || stage.book.verses.length === 1) setStage({ book: null });
    else setStage({ book: stage.book, chapter: null });
  };

  // A held finger: what's under it lights up, its edge scrolls the list, letting go picks it.
  useEffect(() => {
    const hit = (x: number, y: number) =>
      (document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-pick]")?.dataset.pick ?? null);
    const scroll = () => {
      const f = finger.current;
      const el = list.current;
      if (f && el && tracking.current) {
        const r = el.getBoundingClientRect();
        const speed = f.y < r.top + EDGE ? -(r.top + EDGE - f.y) / 4 : f.y > r.bottom - EDGE ? (f.y - (r.bottom - EDGE)) / 4 : 0;
        if (speed) {
          el.scrollTop += speed;
          setHover(hit(f.x, f.y));
        }
      }
      frame.current = requestAnimationFrame(scroll);
    };
    frame.current = requestAnimationFrame(scroll);

    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest("[data-picker-list]")) return;
      tracking.current = true;
      finger.current = { x: e.clientX, y: e.clientY };
      setHover(hit(e.clientX, e.clientY));
    };
    const onMove = (e: PointerEvent) => {
      if (!tracking.current) return;
      finger.current = { x: e.clientX, y: e.clientY };
      setHover(hit(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      finger.current = null;
      const key = hit(e.clientX, e.clientY);
      quietUntil.current = Date.now() + 450;
      if (key) choose(key);
      else setHover(null);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (tracking.current && e.cancelable) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame.current);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("keydown", onKey);
    };
  }, [choose, onClose]);

  const lit = items.find((i) => i.key === hover);
  const title = stage.book === null ? "Bible" : stage.chapter === null ? stage.book.name : `${stage.book.name} ${stage.chapter}`;
  const ask = stage.book === null ? "Slide to a book" : stage.chapter === null ? "Now a chapter" : "And a verse";
  const sections = stage.book === null ? [{ title: "Old Testament", from: 0, to: 39 }, { title: "New Testament", from: 39, to: 66 }] : [{ title: "", from: 0, to: items.length }];

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Go to a verse">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button type="button" onClick={back} aria-label={stage.book === null ? "Close" : "Back"} className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted">
          {stage.book === null ? <X className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-brand text-xl font-semibold tracking-tight">{title}</p>
          <p className="truncate text-sm text-muted-foreground" aria-live="polite">
            {lit ? lit.detail : ask}
          </p>
        </div>
      </div>
      <div ref={list} data-picker-list className="mx-auto w-full max-w-xl flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] touch-none">
        {sections.map((s) => (
          <section key={s.title || "all"} className="mb-3">
            {s.title && <h2 className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">{s.title}</h2>}
            <div className={cn("grid gap-1.5", stage.book === null ? "grid-cols-6" : "grid-cols-7")}>
              {items.slice(s.from, s.to).map((it) => (
                <button
                  key={it.key}
                  type="button"
                  data-pick={it.key}
                  onClick={() => Date.now() > quietUntil.current && choose(it.key)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl border bg-card px-0.5 text-[0.8rem] font-medium tabular-nums transition-[transform,background-color,color] duration-100",
                    hover === it.key ? "z-10 scale-125 border-primary bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted",
                  )}
                >
                  <span className="truncate">{it.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}
