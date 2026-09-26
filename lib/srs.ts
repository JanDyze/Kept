import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import type { Verse } from "@/lib/db/schema";

export type ReviewRating = "again" | "hard" | "good" | "easy";

// Practice is daily (through the games), so skip FSRS's same-day relearning steps and
// schedule in whole days.
const scheduler = fsrs({ enable_short_term: false });

const GRADES: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

type StoredCard = Omit<Card, "due" | "last_review"> & { due: string; last_review?: string };

function toCard(srs: unknown, now: Date): Card {
  if (!srs || typeof srs !== "object") return createEmptyCard(now);
  const s = srs as StoredCard;
  return { ...s, due: new Date(s.due), last_review: s.last_review ? new Date(s.last_review) : undefined };
}

// Applies one rating to a verse's schedule and returns the columns to update.
export function schedule(verse: Pick<Verse, "srs">, rating: ReviewRating, now = new Date()) {
  const { card } = scheduler.next(toCard(verse.srs, now), now, GRADES[rating]);
  return {
    srs: JSON.parse(JSON.stringify(card)) as Record<string, unknown>,
    dueAt: card.due,
  };
}

// Mistakes in a recall game → how well the verse was remembered.
export function ratingFromMistakes(mistakes: number, gaveUp: boolean): ReviewRating {
  if (gaveUp || mistakes >= 3) return "again";
  if (mistakes >= 1) return "hard";
  return "good";
}
