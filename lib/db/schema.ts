import { sql } from "drizzle-orm";
import {
  boolean,
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
import type { CardStyle } from "@/lib/cards/style";

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
  "type_it",
  "say_it",
]);
export const gameStatus = pgEnum("game_status", ["in_progress", "won", "lost"]);
// Who can see a verse's card besides its owner. A public link (share_token) is separate.
export const cardVisibility = pgEnum("card_visibility", ["private", "friends", "everyone"]);
export const friendStatus = pgEnum("friend_status", ["pending", "accepted"]);

// RLS is enabled with no policies: the app connects directly through Drizzle (as the table
// owner), and Supabase's public Data API gets no access. Every query must filter by user_id.

// Notes on a verse, as a thread: dated entries added over time. (verses.notes held a single note
// before; its contents moved here in migration 0007.)
export const verseNotes = pgTable(
  "verse_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    verseId: uuid("verse_id")
      .notNull()
      .references(() => verses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verse_notes_verse_idx").on(t.verseId, t.createdAt)],
).enableRLS();

// Words that could stand in for each word of a verse, from a language model reading the verse
// with that word hidden (lib/games/ai). Shared by everyone keeping the same text: keyed by a hash
// of translation + text, so it's worked out once per verse, not per person.
// `words`: normalized word → alternatives, most likely first.
export const verseAlternatives = pgTable("verse_alternatives", {
  textHash: text("text_hash").primaryKey(),
  translation: text("translation").notNull(),
  model: text("model").notNull(),
  words: jsonb("words").$type<Record<string, string[]>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// Photos a user uploaded as card backgrounds. The bytes live in lib/cards/storage.ts under
// storage_key; the row says who owns them.
export const cardImages = pgTable(
  "card_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("card_images_user_idx").on(t.userId, t.createdAt)],
).enableRLS();

// A person on Kept: the short @username others find them by, and the name shown with their cards.
// Created on first need from their email or Google name (lib/social/profiles.ts).
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull(), // lowercase a-z 0-9 _ .
    displayName: text("display_name"),
    // A picture: the Google account's, or one they uploaded (/api/avatars/…); null shows the initial.
    avatarUrl: text("avatar_url"),
    // They took their picture off: don't fill it back in from Google.
    avatarRemoved: boolean("avatar_removed").notNull().default(false),
    // The app version whose What's new they last saw; null (older accounts) shows the latest once.
    seenVersion: text("seen_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("profiles_username_idx").on(t.username),
    check("profiles_username_format", sql`${t.username} ~ '^[a-z0-9][a-z0-9_.]{2,19}$'`),
  ],
).enableRLS();

// A friendship, from request to accepted. One row per pair, whoever asked first.
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    status: friendStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("friendships_pair_idx").on(sql`least(${t.requesterId}, ${t.addresseeId})`, sql`greatest(${t.requesterId}, ${t.addresseeId})`),
    index("friendships_addressee_idx").on(t.addresseeId, t.status),
    check("friendships_not_self", sql`${t.requesterId} <> ${t.addresseeId}`),
  ],
).enableRLS();

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
    notes: text("notes"), // legacy single note; moved into verse_notes, no longer written
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    // ts-fsrs card state; null until the verse is first practiced in a recall game.
    srs: jsonb("srs").$type<Record<string, unknown>>(),
    // New verses are due immediately.
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    // How the verse's card looks (lib/cards/style.ts); null shows the plain page.
    card: jsonb("card").$type<CardStyle>(),
    // Set while the verse's card has a public link (/s/<token>); null means private.
    shareToken: text("share_token").unique(),
    // Place in the user's own order of My verses (0 first); null until arranged, and new verses
    // (null) sit at the top of that order.
    position: integer("position"),
    visibility: cardVisibility("visibility").notNull().default("private"),
    // When the card was last shown to friends or everyone; orders the Discover gallery.
    publishedAt: timestamp("published_at", { withTimezone: true }),
    // Starred by its owner: kept at the top of My verses whatever the order. Null when not starred.
    starredAt: timestamp("starred_at", { withTimezone: true }),
  },
  (t) => [
    index("verses_user_due_idx").on(t.userId, t.dueAt),
    index("verses_published_idx").on(t.visibility, t.publishedAt),
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

// Games a user loves: listed first on the Games page.
export const gameStars = pgTable(
  "game_stars",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    game: gameKind("game").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.game] })],
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

// Likes on shared cards (Discover → Cards). One per person and card; they raise it in the gallery.
export const cardLikes = pgTable(
  "card_likes",
  {
    verseId: uuid("verse_id")
      .notNull()
      .references(() => verses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.verseId, t.userId] }), index("card_likes_user_idx").on(t.userId)],
).enableRLS();

// Likes on a passage (Discover → Verses), by where it starts, whatever the translation. They
// raise it in Popular alongside how many people keep it.
export const verseLikes = pgTable(
  "verse_likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    bookNumber: integer("book_number").notNull(),
    chapter: integer("chapter").notNull(),
    verseStart: integer("verse_start").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.bookNumber, t.chapter, t.verseStart] }),
    index("verse_likes_place_idx").on(t.bookNumber, t.chapter, t.verseStart),
  ],
).enableRLS();

// Usage, for the admin dashboard: one row per page opened by a signed-in person (paths with ids
// folded to :id). Everything else it shows is counted from the other tables.
export const appEvents = pgTable(
  "app_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // "view", or a tap: "support_give", "support_share"
    path: text("path").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("app_events_created_idx").on(t.createdAt), index("app_events_user_idx").on(t.userId, t.createdAt)],
).enableRLS();

export type Verse = typeof verses.$inferSelect;
export type NewVerse = typeof verses.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type DailyGame = typeof dailyGames.$inferSelect;
