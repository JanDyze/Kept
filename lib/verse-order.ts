// The order My verses showed (its sort, tag and search), saved when a verse is opened from it, so
// the verse page can swipe to the ones either side. Session storage: per tab, gone when it closes.

const KEY = "kept:verse-order";

export function rememberVerseOrder(ids: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

// "prevId|nextId" (either part empty at an end), or "" when this verse wasn't opened from the list.
// A string, so it can be a useSyncExternalStore snapshot.
export function verseNeighbours(id: string) {
  try {
    const ids = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[];
    const i = ids.indexOf(id);
    if (i < 0 || ids.length < 2) return "";
    return `${ids[i - 1] ?? ""}|${ids[i + 1] ?? ""}`;
  } catch {
    return "";
  }
}
