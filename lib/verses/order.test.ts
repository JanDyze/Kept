import { describe, expect, it } from "vitest";
import { orderBy } from "./order";

const v = (id: string, bibleOrder: number, addedAt: number, position: number | null = null) => ({ id, bibleOrder, addedAt, position });
const list = [v("a", 2, 10, 1), v("b", 0, 30, 0), v("c", 1, 20, null), v("d", 3, 40, null)];
const ids = (xs: { id: string }[]) => xs.map((x) => x.id).join("");

describe("My verses order", () => {
  it("sorts newest first, by Bible order, or in your own order", () => {
    expect(ids(orderBy(list, "recent", null))).toBe("dbca");
    expect(ids(orderBy(list, "book", null))).toBe("bcad");
    // unplaced verses (new ones) first, newest first; then your order
    expect(ids(orderBy(list, "mine", null))).toBe("dcba");
  });

  it("uses a just-saved order before the page reloads", () => {
    expect(ids(orderBy(list, "mine", new Map([["d", 0], ["c", 1], ["a", 2], ["b", 3]])))).toBe("dcab");
  });
});
