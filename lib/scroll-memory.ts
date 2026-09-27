// Where a list was left (scroll position and its filters), so coming back to it lands in the same
// spot instead of the top. Saved when a list item is opened; used once on the way back. Keyed by
// path + query ("/verses", "/verses?view=archived"). Session storage: per tab, gone when it closes.

export type ListMemory = { y: number; query?: string; tag?: string; at: number };

const PREFIX = "kept:list:";
const MAX_AGE = 30 * 60 * 1000; // a stale spot from long ago is more confusing than the top

const keyFor = (path: string) => PREFIX + path;
export const currentPath = () => location.pathname + location.search;

export function rememberList(path: string, memory: Omit<ListMemory, "at">) {
  try {
    sessionStorage.setItem(keyFor(path), JSON.stringify({ ...memory, at: Date.now() }));
  } catch {}
}

function read(path: string): ListMemory | null {
  try {
    const raw = sessionStorage.getItem(keyFor(path));
    const memory = raw ? (JSON.parse(raw) as ListMemory) : null;
    return memory && Date.now() - memory.at < MAX_AGE ? memory : null;
  } catch {
    return null;
  }
}

export function hasListMemory(path: string) {
  return read(path) !== null;
}

// Returns the memory and forgets it, so a later visit starts fresh.
export function takeListMemory(path: string) {
  const memory = read(path);
  try {
    sessionStorage.removeItem(keyFor(path));
  } catch {}
  return memory;
}
