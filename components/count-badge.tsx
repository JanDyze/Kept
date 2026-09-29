"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

// A small count on the corner of an icon: something waiting on you (friend requests, games left).
// Place it inside a `relative` box. The ring matches the surface behind it so it reads as cut out.
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -top-1.5 -right-1.5 flex h-5.5 min-w-5.5 animate-pop items-center justify-center rounded-full bg-primary px-1.5 text-xs leading-none font-semibold tabular-nums text-primary-foreground ring-2 ring-card",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// The installed app's icon shows the same total, where the phone supports app badges.
export function AppBadge({ count }: { count: number }) {
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (count > 0) nav.setAppBadge?.(count).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
  }, [count]);
  return null;
}
