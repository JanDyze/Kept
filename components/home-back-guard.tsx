"use client";

import { useEffect, useState } from "react";
import { homeGuardKey, navigationApi, setHomeGuardKey } from "@/lib/nav-history";

const WINDOW_MS = 2500;
// When Back last stepped off the guard; kept outside the component in case Home re-mounts.
let steppedOffAt = 0;

// On Home, the phone's Back asks first: the first press shows "Press back again to exit", a second
// one within a moment leaves the app. It works by keeping a second Home entry (the guard) on top
// of Home: Back steps off the guard onto Home itself, which is the bottom of the app's history
// (going back to Home always returns to its first visit, see earlierVisit), so the next Back
// closes the installed app, or leaves the site in a browser tab. After the moment passes, the
// guard goes back on. A web app can't close itself any other way.
export function HomeBackGuard() {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const nav = navigationApi();
    if (!nav) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onHome = () => location.pathname === "/";
    const pushGuard = () => {
      if (!onHome() || nav.currentEntry?.key === homeGuardKey()) return;
      history.pushState(null, "", location.pathname + location.search);
      const key = nav.currentEntry?.key;
      if (key) setHomeGuardKey(key);
    };
    const ask = (forMs: number) => {
      setAsking(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setAsking(false);
        pushGuard();
      }, forMs);
    };

    // Arriving on Home: put the guard on, once the navigation has settled (coming from another
    // page, the address may not say "/" yet). Unless Back just stepped off it: then keep asking.
    const arrive = setTimeout(() => {
      const left = WINDOW_MS - (Date.now() - steppedOffAt);
      if (left > 0 && onHome()) ask(left);
      else pushGuard();
    }, 50);

    const onEntry = (e: Event & { navigationType: string | null; from: { key: string } }) => {
      if (e.navigationType !== "traverse" || !onHome() || e.from?.key !== homeGuardKey()) return;
      steppedOffAt = Date.now();
      ask(WINDOW_MS);
    };
    nav.addEventListener("currententrychange", onEntry);
    return () => {
      nav.removeEventListener("currententrychange", onEntry);
      clearTimeout(arrive);
      clearTimeout(timer);
    };
  }, []);

  if (!asking) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p role="status" className="animate-rise rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg">
        Press back again to exit
      </p>
    </div>
  );
}
