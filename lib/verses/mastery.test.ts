import { describe, expect, it } from "vitest";
import { seededRandom } from "@/lib/games/random";
import { schedule } from "@/lib/srs";
import { mastery, weakness, weightedOrder } from "./mastery";

const DAY = 86_400_000;

// Reviews a fresh verse with these ratings, a day after each is due.
function practiced(ratings: ("again" | "hard" | "good" | "easy")[], start = new Date("2026-01-01T09:00:00Z")) {
  let srs: Record<string, unknown> | null = null;
  let at = start;
  for (const r of ratings) {
    const next = schedule({ srs }, r, at);
    srs = next.srs;
    at = new Date(next.dueAt.getTime());
  }
  return { srs, at };
}

describe("mastery", () => {
  it("is new until practiced", () => {
    expect(mastery(null)).toBe("new");
  });

  it("is learning after a first good review", () => {
    const { srs, at } = practiced(["good"]);
    expect(mastery(srs, at)).toBe("learning");
  });

  it("is mastered after steady good reviews, and learning again after a lapse", () => {
    const { srs, at } = practiced(["good", "good", "easy", "good", "good"]);
    expect(mastery(srs, at)).toBe("mastered");
    const lapsed = schedule({ srs }, "again", at).srs;
    expect(mastery(lapsed, at)).toBe("learning");
  });

  it("fades back to learning when left far too long", () => {
    const { srs, at } = practiced(["good", "good", "good"]);
    expect(mastery(srs, at)).toBe("mastered");
    expect(mastery(srs, new Date(at.getTime() + 365 * DAY))).toBe("learning");
  });
});

describe("weakness", () => {
  it("weighs a struggling verse above a mastered one, but never at zero", () => {
    const strong = practiced(["good", "good", "easy", "good", "good"]);
    const shaky = practiced(["hard", "again", "hard"]);
    const now = new Date(Math.max(strong.at.getTime(), shaky.at.getTime()));
    expect(weakness(shaky.srs, now)).toBeGreaterThan(weakness(strong.srs, now));
    expect(weakness(strong.srs, now)).toBeGreaterThan(0);
  });
});

describe("weightedOrder", () => {
  it("puts heavier items first more often, yet lets light ones lead sometimes", () => {
    const items = ["weak", "mastered"];
    const w = (x: string) => (x === "weak" ? 2 : 0.2);
    let weakFirst = 0;
    for (let i = 0; i < 500; i++) if (weightedOrder(items, w, seededRandom(`s${i}`))[0] === "weak") weakFirst++;
    expect(weakFirst).toBeGreaterThan(400);
    expect(weakFirst).toBeLessThan(500);
  });

  it("is the same for the same seed", () => {
    const items = ["a", "b", "c", "d"];
    expect(weightedOrder(items, () => 1, seededRandom("x"))).toEqual(weightedOrder(items, () => 1, seededRandom("x")));
  });
});
