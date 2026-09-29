"use client";

import { useEffect } from "react";
import { homeGuardKey, navigationApi, takePendingSteps } from "@/lib/nav-history";

// Mounted once in the root layout. Keeps the tab's history the way you came, so the phone's own
// Back goes where you'd expect. After a page replaces the current entry:
// - a back arrow that found its page earlier in history (BackNavLink) steps back onto that entry.
//   The page is already showing (it slid in like any back), so nothing visibly changes.
// - a saved form that landed on the page before it (the RedirectType.replace in the save actions)
//   steps back onto that entry too, so Back after saving doesn't open the form again.
export function NavHistory() {
  useEffect(() => {
    const nav = navigationApi();
    if (!nav) return;
    const onEntry = (e: Event & { navigationType: string | null }) => {
      const current = nav.currentEntry;
      if (e.navigationType !== "replace" || !current?.url) return;
      const steps = takePendingSteps();
      if (steps) return history.go(-steps);
      if (current.key === homeGuardKey()) return; // Home's guard sits on Home on purpose
      const before = nav.entries().find((x) => x.index === current.index - 1);
      if (before?.url === current.url) history.back();
    };
    nav.addEventListener("currententrychange", onEntry);
    return () => nav.removeEventListener("currententrychange", onEntry);
  }, []);
  return null;
}
