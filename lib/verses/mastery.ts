import { fsrs, State, type Card } from "ts-fsrs";
import type { Rng } from "@/lib/games/random";

// How well a verse is known, from its FSRS state (lib/srs.ts), which the recall games update:
// - new: never practiced in a recall game
// - mastered: in review with a memory that lasts three weeks or more (stability ≥ 21 days), seen
//   at least three times, and not faded since (today's recall chance still ≥ 85%)
// - learning: everything in between, including a mastered verse that slipped (a lapse drops it
//   back into relearning until it's remembered again)
export type Mastery = "new" | "learning" | "mastered";

export const MASTERED_STABILITY_DAYS = 21;
const MASTERED_MIN_REPS = 3;
const MASTERED_MIN_RECALL = 0.85;

const scheduler = fsrs({ enable_short_term: false });

type Stored = {
  state?: number;
  stability?: number;
  difficulty?: number;
  reps?: number;
  lapses?: number;
  due?: string;
  last_review?: string;
};

function asCard(s: Stored): Card {
  return {
    due: new Date(s.due ?? Date.now()),
    stability: s.stability ?? 0,
    difficulty: s.difficulty ?? 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: s.reps ?? 0,
    lapses: s.lapses ?? 0,
    state: (s.state ?? State.New) as State,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  };
}

// Chance of recalling it now (0–1); 0 for a verse never practiced.
export function recallChance(srs: unknown, now = new Date()): number {
  if (!srs || typeof srs !== "object") return 0;
  const s = srs as Stored;
  if (!s.stability || !s.last_review) return 0;
  const r = scheduler.get_retrievability(asCard(s), now, false);
  return Number.isFinite(r) ? r : 0;
}

export function mastery(srs: unknown, now = new Date()): Mastery {
  if (!srs || typeof srs !== "object") return "new";
  const s = srs as Stored;
  const mastered =
    s.state === State.Review &&
    (s.stability ?? 0) >= MASTERED_STABILITY_DAYS &&
    (s.reps ?? 0) >= MASTERED_MIN_REPS &&
    recallChance(s, now) >= MASTERED_MIN_RECALL;
  return mastered ? "mastered" : "learning";
}

// How much a verse needs practice, for choosing verses for the games: fading memories, hard
// verses and ones that lapsed weigh more. Never zero, so mastered verses still come round, just
// less often.
export function weakness(srs: unknown, now = new Date()): number {
  if (!srs || typeof srs !== "object") return 1.2;
  const s = srs as Stored;
  const fading = 1 - recallChance(s, now);
  const hard = Math.max(0, Math.min(1, ((s.difficulty ?? 5) - 1) / 9));
  const lapses = Math.min(s.lapses ?? 0, 5);
  const w = 0.15 + fading * 1.2 + hard * 0.5 + lapses * 0.08;
  return mastery(s, now) === "mastered" ? Math.max(0.1, w * 0.5) : w;
}

// A weighted shuffle (Efraimidis–Spirakis): heavier items tend to come first, but any item can.
// Seeded, so a day's picks are the same on every rebuild.
export function weightedOrder<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(rng() || Number.MIN_VALUE, 1 / Math.max(weight(item), 1e-6)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}
