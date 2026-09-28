import type { LibrarySort } from "./view";

type Orderable = { id: string; bibleOrder?: number; addedAt?: number; position?: number | null };

// The three orders: newest first, Bible order, or the user's own (unplaced verses first, newest
// of those first).
export function orderBy<T extends Orderable>(items: T[], sort: LibrarySort, positions: Map<string, number> | null) {
  const pos = (v: T) => positions?.get(v.id) ?? v.position ?? null;
  return [...items].sort((a, b) => {
    if (sort === "book") return (a.bibleOrder ?? 0) - (b.bibleOrder ?? 0);
    if (sort === "mine") {
      const pa = pos(a);
      const pb = pos(b);
      if (pa !== pb) return pa === null ? -1 : pb === null ? 1 : pa - pb;
    }
    return (b.addedAt ?? 0) - (a.addedAt ?? 0);
  });
}
