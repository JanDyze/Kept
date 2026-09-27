"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { hasListMemory } from "@/lib/scroll-memory";

const noSubscription = () => () => {};

// The top bar's back link. When the page it goes back to remembers where it was left (a list you
// scrolled, then opened an item from), Next.js is told not to scroll to the top, so the list can
// put you back in the same spot.
export function BackNavLink(props: Omit<React.ComponentProps<typeof Link>, "href" | "scroll"> & { href: string }) {
  const remembered = useSyncExternalStore(
    noSubscription,
    () => hasListMemory(props.href),
    () => false,
  );
  return <Link {...props} scroll={!remembered} />;
}
