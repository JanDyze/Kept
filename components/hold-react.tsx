"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ReactionIcon } from "@/components/reaction-icon";
import { REACTION_KEYS, REACTIONS, type Reaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";

const HOLD_MS = 420;
const SLOP = 10; // px a finger may drift before a hold becomes a scroll

// Events from the bar (a portal) still bubble through React to the wrapper: leave those alone.
const fromBar = (e: React.SyntheticEvent) => e.target instanceof Element && e.target.closest("[data-react-bar]") !== null;

// Hold anything wrapped in this to react to it: after a moment it lifts and a bar of reactions
// opens over it. Slide to one and let go to pick it, or let go and tap one; picking the current
// reaction again takes it back. A hold never opens the link underneath. Right-click opens it too.
// `badge` shows the current reaction on the corner, like a tapback.
export function HoldReact({
  reaction,
  onReact,
  badge = true,
  className,
  children,
}: {
  reaction: Reaction | null;
  onReact: (r: Reaction | null) => void;
  badge?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const [pressing, setPressing] = useState(false);
  const [open, setOpen] = useState<DOMRect | null>(null);
  const [hover, setHover] = useState<Reaction | null>(null);

  const close = () => {
    setOpen(null);
    setHover(null);
    delete document.documentElement.dataset.holding;
    // The click that follows the release still has to be swallowed; then taps work again.
    window.setTimeout(() => (held.current = false), 400);
  };
  const lastPick = useRef(0);
  const pick = (r: Reaction) => {
    // A release over a reaction picks it; the click the release then fires mustn't pick it again.
    if (Date.now() - lastPick.current < 500) return;
    lastPick.current = Date.now();
    onReact(r === reaction ? null : r);
    close();
  };
  const cancel = () => {
    clearTimeout(timer.current);
    start.current = null;
    setPressing(false);
  };

  // While the bar is open under a finger, the page mustn't scroll or swipe instead.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (held.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const openAt = () => {
    held.current = true;
    setPressing(false);
    navigator.vibrate?.(8);
    document.documentElement.dataset.holding = "1";
    setOpen(ref.current!.getBoundingClientRect());
  };

  return (
    <div
      ref={ref}
      className={cn("relative select-none [-webkit-touch-callout:none]", className)}
      onPointerDown={(e) => {
        if (fromBar(e) || (e.pointerType === "mouse" && e.button !== 0)) return;
        held.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        setPressing(true);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(openAt, HOLD_MS);
      }}
      onPointerMove={(e) => {
        if (fromBar(e) && !held.current) return;
        if (held.current && open) {
          const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-reaction]");
          setHover((el?.dataset.reaction as Reaction | undefined) ?? null);
          return;
        }
        const s = start.current;
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) cancel();
      }}
      onPointerUp={(e) => {
        if (fromBar(e) && !start.current) return;
        clearTimeout(timer.current);
        setPressing(false);
        start.current = null;
        if (held.current && hover) pick(hover);
      }}
      onPointerCancel={() => {
        if (!held.current) cancel();
      }}
      onContextMenu={(e) => {
        if (fromBar(e)) return;
        e.preventDefault();
        if (!open) openAt();
      }}
      onClickCapture={(e) => {
        // The tap that ends a hold isn't a tap on the link underneath.
        if (fromBar(e)) return;
        if (held.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: pressing ? "scale(0.97)" : open ? "scale(1.02)" : undefined }}
      >
        {children}
      </div>
      {badge && reaction && (
        <span
          key={reaction}
          className="animate-pop pointer-events-none absolute -top-2.5 -right-1.5 z-10 flex size-8 items-center justify-center rounded-full bg-background shadow-[0_2px_8px_rgb(0_0_0/0.18)] ring-1 ring-border"
          aria-label={`You reacted ${REACTIONS[reaction].label}`}
        >
          <ReactionIcon reaction={reaction} className="size-5" />
        </span>
      )}
      {open && <Bar rect={open} current={reaction} hover={hover} onPick={pick} onClose={close} />}
    </div>
  );
}

function Bar({
  rect,
  current,
  hover,
  onPick,
  onClose,
}: {
  rect: DOMRect;
  current: Reaction | null;
  hover: Reaction | null;
  onPick: (r: Reaction) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  const width = Math.min(REACTION_KEYS.length * 48 + 12, innerWidth - 24);
  const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), innerWidth - width - 12);
  // Over the thing held when there's room, else just inside its top.
  const top = rect.top > 76 ? rect.top - 64 : Math.max(12, rect.top + 12);

  return createPortal(
    <div data-react-bar>
      {/* Closes on press, not click: letting go of a mouse hold mustn't close it. */}
      <button type="button" aria-label="Close" tabIndex={-1} onPointerDown={onClose} className="fixed inset-0 z-[80] cursor-default" />
      <div
        role="menu"
        aria-label="React"
        className="animate-pop fixed z-[81] flex items-center justify-between rounded-full border bg-popover px-1.5 py-1 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35)]"
        style={{ left, top, width }}
      >
        {REACTION_KEYS.map((r) => (
          <button
            key={r}
            type="button"
            role="menuitemradio"
            aria-checked={current === r}
            aria-label={REACTIONS[r].label}
            data-reaction={r}
            onClick={() => onPick(r)}
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition-transform duration-150",
              hover === r ? "-translate-y-2 scale-135" : "hover:-translate-y-1 hover:scale-125",
              current === r && "bg-primary/15",
            )}
          >
            <ReactionIcon reaction={r} className="size-7" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
