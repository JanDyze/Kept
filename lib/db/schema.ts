import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

export const reviewRating = pgEnum("review_rating", ["again", "hard", "good", "easy"]);
export const practiceMode = pgEnum("practice_mode", ["read", "first_letter", "fill_blank", "recite", "unscramble"]);
export const gameKind = pgEnum("game_kind", [
  "missing_word",
  "reference_wordle",
  "fill_blanks",
  "unscramble",
  "first_letters",
  "spot_change",
  "match_up",
  "two_tongues",
]);
export const gameStatus = pgEnum("game_status", ["in_progress", "won", "lost"]);

// RLS is enabled with no policies: the app connects directly through Drizzle (as the table
// owner), and Supabase's public Data API gets no access. Every query must filter by user_id.

export const verses = pgTable(
  "verses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    reference: text("reference").notNull(),
    book: text("book").notNull(),
    bookNumber: integer("book_number").notNull(),
    chapter: integer("chapter").notNull(),
    verseStart: integer("verse_start").notNull(),
    verseEnd: integer("verse_end"),
    translation: text("translation").notNull(),
    text: text("text").notNull(),
    notes: text("notes"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    // ts-fsrs card state; null until the verse is first practiced in a recall game.
    srs: jsonb("srs").$type<Record<string, unknown>>(),
    // New verses are due immediately.
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    index("verses_user_due_idx").on(t.userId, t.dueAt),
    check("verses_book_number_range", sql`${t.bookNumber} between 1 and 66`),
    check("verses_verse_range", sql`${t.verseEnd} is null or ${t.verseEnd} >= ${t.verseStart}`),
  ],
).enableRLS();

// Append-only log: rows are inserted, never updated.
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    verseId: uuid("verse_id")
      .notNull()
      .references(() => verses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
    rating: reviewRating("rating").notNull(),
    mode: practiceMode("mode").notNull(),
    durationMs: integer("duration_ms"),
  },
  (t) => [
    index("reviews_user_reviewed_idx").on(t.userId, t.reviewedAt),
    index("reviews_verse_idx").on(t.verseId),
  ],
).enableRLS();

// Reference text for auto-filling verses, loaded from local copies by scripts/import-bible.mjs.
// Not user data. Some translations merge verses (MBBTAG prints 1 Chr 4:3-4 as one), so each
// row covers verse..verse_end.
export const bibleVerses = pgTable(
  "bible_verses",
  {
    translation: text("translation").notNull(),
    bookNumber: integer("book_number").notNull(),
    chapter: integer("chapter").notNull(),
    verse: integer("verse").notNull(),
    verseEnd: integer("verse_end").notNull(),
    text: text("text").notNull(),
  },
  (t) => [primaryKey({ columns: [t.translation, t.bookNumber, t.chapter, t.verse] })],
).enableRLS();

// One row per user, day and game. The puzzle (with a snapshot of the verse text) is saved when the
// day's shelf is first opened, so it stays the same across devices and edits.
export const dailyGames = pgTable(
  "daily_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(), // local calendar date, YYYY-MM-DD
    game: gameKind("game").notNull(),
    verseIds: uuid("verse_ids").array().notNull(),
    puzzle: jsonb("puzzle").notNull(),
    state: jsonb("state").notNull().default({}),
    status: gameStatus("status").notNull().default("in_progress"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("daily_games_user_day_game_idx").on(t.userId, t.day, t.game)],
).enableRLS();

// OpenBible.info Topical Bible (CC BY 4.0): which verses people found relevant to a topic, with
// vote counts. Loaded by scripts/import-topics.mjs; powers topic search ("depression", "mothers").
export const topicVerses = pgTable(
  "topic_verses",
  {
    topic: text("topic").notNull(),
    bookNumber: integer("book_number").notNull(),
    chapter: integer("chapter").notNull(),
    verseStart: integer("verse_start").notNull(),
    verseEnd: integer("verse_end"),
    votes: integer("votes").notNull(),
  },
  (t) => [index("topic_verses_topic_idx").on(t.topic, t.votes)],
).enableRLS();

export type Verse = typeof verses.$inferSelect;
export type NewVerse = typeof verses.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type DailyGame = typeof dailyGames.$inferSelect;
