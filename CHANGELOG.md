# Changelog

All notable changes to Kept, one version per feature.

## 0.11.0 — Verse cards

- Any verse can become a card: "Make it a card" on the verse page opens an editor with a live preview.
- Background: the theme's card, ten colors (Ink, Night, Teal, Forest, Plum, Clay, Gold, Sand, Mist, Paper), or your own photo with dim and blur; paper grain on top of any of them.
- Text: five fonts (Serif, Classic, Display, Sans, Hand), eight text colors or Auto, three sizes, left or centered, and the reference at the top or bottom. Long passages set smaller on their own.
- Photos: drag in the preview to move them and zoom in, so landscape photos can be framed on the portrait card too. The preview switches between the card and its tile in My verses.
- The card shows on the verse page and in My verses, in its colors, photo and font. "Plain page" goes back to the old look.
- My verses: newest first by default, with a Recent / Book switch (remembered); always shows the verses' text (the references-only view is gone).
- Opening a verse from My verses morphs it into place: its tile grows into the card (colors and photo carried across) and the text flies to its spot; plain verses carry their reference and text. Going back plays it in reverse, and the card morphs into the card editor's preview.
- The top bar hides while scrolling down and comes back when scrolling up; sticky bars below it move up with it.
- Photos are shrunk in the browser before upload, kept per user, reusable across verses, and can be deleted (cards using one go back to plain). For now they're stored on the dev machine's disk (`data/card-images`); `lib/cards/storage.ts` is the one place to switch to cloud storage before deploying.

## 0.10.2 — New icons

- Home icons redrawn from the new sheet (`brand/HomeIcons.png`): puzzle pieces for Games, a stack of quote cards for My Verses, a closed Bible with a cross, a compass for Discover, and sliders for Settings. My Verses fans its cards out on hover.
- Game icons redrawn from the new sheet (`brand/GameIcons.png`): lettered tiles and an arrow for Unscramble, A B C beside lines for First Letters, a verse with a ? gap for Missing Word, a Bible marked 3:16 for Reference, two pages with the change circled for Spot the Change, fitted puzzle pieces for Match Up, and A / 文 speech bubbles for Two Tongues. Fill the Blanks shows an empty, underlined blank with a sparkling word tile above it.
- A game's name is in the top bar instead of a big heading on the page.
- Wrong choices in Fill the Blanks and swapped words in Spot the Change are never names (no more “jose”) or pieces of hyphenated words (“taasang”).
- Names, God and Diyos keep their capital in the word bank and in Missing Word's answer.
- Add / Edit verse redesigned: the title in the top bar, no keyboard popping up on open, a large reference field that checks itself, a segmented translation switch, the verse shown as a card once found, tags as chips, tags and notes folded away, and Save in a sticky bar.

## 0.10.1 — goodthemes 0.2

- goodthemes 0.2.0: nine themes renamed away from proper names (Eden is now First Garden, Zion is Pearl Gates, and so on), Shepherd's light mode is meadow green, and updated sigils.
- A theme saved under its old name carries over to the new one.

## 0.10.0 — Games redesign

- All eight games share one layout: the verse on a card, a segmented progress bar, and a sticky bottom bar with the controls, progress, mistakes and Give up.
- Fill the Blanks plays one verse per round, each with its own word bank; a finished verse stays up a moment before the next slides in.
- The result replaces the board instead of appearing below it: a headline, a summary that adds something (per-verse rows, the guess grid, the swapped words, the matched pairs, round-by-round answers), and Next / Play again / All games.
- Play again after finishing, as practice: judged in the browser, saved nowhere, so today's result, the streak and review schedules keep the first play.
- Reference guesses show as colored chips with arrows (no legend); Missing Word's grid and keyboard fit on a phone screen.
- Fix: submitting a guess in Reference no longer brings up the loading overlay.

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
