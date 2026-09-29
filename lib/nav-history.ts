// The tab's own history, read through the Navigation API (Chrome, Edge, Safari 26+). Other browsers
// have no way to look at it, so the helpers here answer "don't know" there and callers fall back.

type Entry = { url: string | null; index: number; key: string };
type EntryChange = Event & { navigationType: "push" | "replace" | "reload" | "traverse" | null; from: Entry };
export type NavigationLike = EventTarget & {
  currentEntry: Entry | null;
  entries(): Entry[];
  addEventListener(type: "currententrychange", listener: (e: EntryChange) => void): void;
  removeEventListener(type: "currententrychange", listener: (e: EntryChange) => void): void;
};

export function navigationApi(): NavigationLike | null {
  return (typeof window !== "undefined" && (window as unknown as { navigation?: NavigationLike }).navigation) || null;
}

// Same page: same path, and the same query when `href` names one (a back link to "/verses" lands on
// the list however it was filtered; one to "/verses?view=archived" only on that view).
function samePage(url: string, href: string) {
  const a = new URL(url);
  const b = new URL(href, location.href);
  return a.origin === b.origin && a.pathname === b.pathname && (!b.search || a.search === b.search);
}

// The latest visit to `href` earlier in this tab: how many steps back it is and its exact address
// (with the filters it had). Null when it isn't there, or the browser can't tell.
// Home is the exception: its first visit, so Home stays at the bottom of the history and Back from
// it leaves the app (see HomeBackGuard).
export function earlierVisit(href: string) {
  const nav = navigationApi();
  const current = nav?.currentEntry;
  if (!nav || !current) return null;
  const earlier = nav.entries().filter((e) => e.index < current.index && e.url);
  if (new URL(href, location.href).pathname === "/") earlier.reverse();
  for (let i = earlier.length - 1; i >= 0; i--) {
    if (!samePage(earlier[i].url!, href)) continue;
    const url = new URL(earlier[i].url!);
    return { steps: current.index - earlier[i].index, path: url.pathname + url.search };
  }
  return null;
}

// Steps to go back once the page being shown replaces the current entry (see NavHistory). Kept
// briefly, so a navigation that never happened can't send a later one back.
let pending = { steps: 0, at: 0 };
export function goBackAfterReplace(steps: number) {
  pending = { steps, at: Date.now() };
}
export function takePendingSteps() {
  const { steps, at } = pending;
  pending = { steps: 0, at: 0 };
  return Date.now() - at < 10_000 ? steps : 0;
}

// Home's guard: a second entry for Home pushed on top of it, so the first Back only steps off the
// guard (and asks "press again to exit"). Remembered by its entry key, which lasts across reloads.
const GUARD_KEY = "kept:home-guard";
export function homeGuardKey() {
  try {
    return sessionStorage.getItem(GUARD_KEY);
  } catch {
    return null;
  }
}
export function setHomeGuardKey(key: string) {
  try {
    sessionStorage.setItem(GUARD_KEY, key);
  } catch {}
}
