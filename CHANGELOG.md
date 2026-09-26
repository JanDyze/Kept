# Changelog

All notable changes to Kept, one version per feature.

## 0.9.0 — Themes

- goodthemes: fourteen themes from the Bible story (Eden to Zion) in Settings, next to Kept's own look. Each changes colors, type, texture and radius, animates the switch, and can play moving scenery.
- The today card, icons, headings and verse text follow the theme; the phone's status bar takes its background.
- Light / dark / system now comes from goodthemes (replaces next-themes).
- goodthemes is vendored as `vendor/goodthemes.tgz` so it builds on Vercel; `npm run themes:update` refreshes it.

## 0.8.0 — Home

- Today card with progress and streak (opens Progress), cards for Games, My verses, Bible and Settings, and Discover; fits within 80% of the screen.
- Icons drawn from the Kept icon sheet (`brand/KeptIcons.png`).
- README.

## 0.7.0 — Progress

- Current and best streak, games played, a 12-week calendar, per-game results, verse counts, and most-missed and strongest verses.

## 0.6.0 — Daily games

- Eight games, each once a day: Fill the Blanks, Unscramble and First Letters (recall games that update the ts-fsrs review schedule), Missing Word, Reference, Spot the Change, Match Up and Two Tongues.
- Puzzles are built and saved when the day is first opened, resumable across devices; the day follows the device time zone; streaks.
- App-grid shelf with an icon and result per game; unit tests for the game rules and scheduling.

## 0.5.0 — Bible

- Read any chapter in ESV or MBBTAG (Tagalog book names); tap a verse or range and keep it.
- Bible search: a reference or chapter jumps there, a book opens it, other text searches the exact words.

## 0.4.0 — Discover

- Topic search from the OpenBible.info Topical Bible (CC BY): feelings and occasions ("depression", "birthdays"), common Tagalog words, and exact-word matches (`npm run topics:import`).
- Popular list: verses kept by the most other users first, then OpenBible's most-loved.

## 0.3.0 — My verses

- Add, edit and archive verses with tags and notes; ESV and MBBTAG text fills in from your copies and can't be edited (enforced server-side).
- Library: instant filter, capitalized tag chips, grouped by book, and a Text / Reference-only view with peek (remembered).

## 0.2.0 — Bible text

- `npm run bible:import` loads your local ESV and MBBTAG copies into `bible_verses` (the source folders stay out of git).
- Reference parser: abbreviations, ordinals, Roman numerals and Tagalog book names (`jn 3 16`, `II Tim 3:16`, `Juan 3:16`).
- Passage lookup that widens MBBTAG's merged verses and reports verses ESV omits.

## 0.1.0 — Foundation

- Next.js 16 (App Router) with Supabase email/password auth for a single account; `proxy.ts` redirects signed-out visitors and pages re-check the session.
- Drizzle schema and migrations for verses, reviews, Bible text, topics and daily games; row level security on with no policies.
- App shell: sticky title bar, directional page transitions, app-like touch behavior (no long-press menus or text selection), dark mode (System / Light / Dark), and an animated-logo loading overlay with a verse when a page takes over a second.
- Settings page and a daily keep-alive cron for the free Supabase project.
