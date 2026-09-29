"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { earlierVisit, goBackAfterReplace } from "@/lib/nav-history";
import { hasListMemory } from "@/lib/scroll-memory";

const noSubscription = () => () => {};

// The top bar's back link. It never adds a history entry, so the phone's own Back goes where you'd
// expect instead of to the page you just left: it replaces this page with the one it names, and
// when that page is earlier in the tab's history (the way you came), it then steps back onto it
// (NavHistory does, once the page is showing). The page still slides in like any back.
// When the page it goes back to remembers where it was left (a list you scrolled, then opened an
// item from), Next.js is told not to scroll to the top, so the list can put you back in the same spot.
export function BackNavLink({
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href" | "scroll" | "replace"> & { href: string }) {
  const router = useRouter();
  const remembered = useSyncExternalStore(
    noSubscription,
    () => hasListMemory(props.href),
    () => false,
  );
  return (
    <Link
      {...props}
      replace
      scroll={!remembered}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const visit = earlierVisit(props.href);
        if (!visit) return;
        e.preventDefault();
        goBackAfterReplace(visit.steps);
        router.replace(visit.path, { scroll: !remembered, transitionTypes: ["nav-back"] });
      }}
    />
  );
}
