"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 60; // px of travel that counts as a swipe

// Swipe the page sideways for the next or previous one in the list it came from (arrow keys and
// the side buttons too). The page follows the finger, then the next one slides in. Pages replace
// each other, so Back still returns to the list. A drag that starts in a text field is left alone.
export function CardSwiper({
  prevHref,
  nextHref,
  className,
  children,
}: {
  prevHref: string | null;
  nextHref: string | null;
  className?: string; // e.g. "flex flex-1 flex-col" to wrap a whole page's content
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number; axis: "x" | "y" | null } | null>(null);

  const go = (href: string | null, dir: "next" | "prev") => {
    if (!href) return;
    router.replace(href, { scroll: false, transitionTypes: [dir === "next" ? "nav-forward" : "nav-back"] });
  };

  useEffect(() => {
    if (nextHref) router.prefetch(nextHref);
    if (prevHref) router.prefetch(prevHref);
  }, [router, nextHref, prevHref]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") go(nextHref, "next");
      if (e.key === "ArrowLeft") go(prevHref, "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn("touch-pan-y", className)}
        style={{
          transform: dx ? `translateX(${dx}px)` : undefined,
          transition: dragging ? "none" : "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
          start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: null };
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s || s.id !== e.pointerId) return;
          const mx = e.clientX - s.x;
          const my = e.clientY - s.y;
          if (!s.axis && Math.hypot(mx, my) > 8) {
            s.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
            if (s.axis === "x") {
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch {}
              setDragging(true);
            }
          }
          if (s.axis !== "x") return;
          // At the ends of the list the card only gives a little.
          const blocked = (mx < 0 && !nextHref) || (mx > 0 && !prevHref);
          setDx(blocked ? mx * 0.2 : mx);
        }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          setDragging(false);
          if (!s || s.axis !== "x") return setDx(0);
          const mx = e.clientX - s.x;
          if (mx <= -THRESHOLD && nextHref) {
            setDx(-window.innerWidth);
            go(nextHref, "next");
          } else if (mx >= THRESHOLD && prevHref) {
            setDx(window.innerWidth);
            go(prevHref, "prev");
          } else setDx(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setDx(0);
        }}
        onClickCapture={(e) => {
          // A swipe that ended over a link isn't a tap.
          if (Math.abs(dx) > 8) e.preventDefault();
        }}
      >
        {children}
      </div>
      <SideButton dir="prev" disabled={!prevHref} onClick={() => go(prevHref, "prev")} />
      <SideButton dir="next" disabled={!nextHref} onClick={() => go(nextHref, "next")} />
    </div>
  );
}

// Only on wide screens, where there's room beside the card and no thumb to swipe with.
function SideButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous card" : "Next card"}
      className={cn(
        "absolute top-40 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-opacity hover:text-foreground disabled:opacity-0 md:flex",
        dir === "prev" ? "-left-14" : "-right-14",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
