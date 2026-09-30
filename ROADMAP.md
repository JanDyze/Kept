# Roadmap

Planned, not built yet. Kept is growing from a personal tool into an app many people share.

## Discover, shaped by everyone

Discover (`/search`) keeps today's defaults (topics from the OpenBible.info Topical Bible, and
search by topic, feeling or wording). It already shows what the community keeps:

- **Most saved verses** across all users: built (0.14.0). Popular counts every save, shared or
  not (only a number shows), plus likes, then OpenBible's ranking.
- **Most used tags**: built (0.14.0), shown once at least two people use a tag.
- **A gallery of cards**: built (Discover → Cards, Pinterest-style, ranked by likes and age).
  Next: search and tags within the gallery, and loading more than the first 60.

## Social

- Friends: built (usernames, requests, profiles at `/u/name`, friends-only cards).
- **Leaderboards** (soon): weekly and all-time boards among friends, then everyone — streaks,
  games won, verses mastered. Only people who opt in appear on the public board.
- **Multiplayer games** (soon): the daily puzzle builders already take a seed, so friends can
  play the very same puzzle. Ideas, roughly in the order to build them:
  - **Challenge a friend** (first): play today's puzzle, then send it; they play the same seed
    whenever they like and you compare time, mistakes and stars. No live connection needed.
  - **Weekly friend league**: everyone plays the same daily puzzles; a weekly board ranks friends
    by stars (with Leaderboards above).
  - **Verse Race** (live): both get the same Unscramble or Fill the Blanks; first to finish wins,
    with the other's progress showing as they go.
  - **Reference Duel** (live): a verse's text appears; race to name the book and chapter.
    Reference Wordle's guessing, about 10 quick rounds.
  - **Spot It First** (live): the same Spot the Change verse for both; first to tap the changed
    word takes the point.
  - **Pass the verse** (turns): take turns saying the next word or phrase from memory, First
    Letters as the hint; a wrong word ends your turn.
  - **Co-op Recite**: two people split a passage (odd and even verses) and score as a team on
    how far they get together.
  - **Group memory goal**: a small group or church group picks a verse for the week, and
    everyone's practice fills one shared bar. Less competition, more encouragement.
  - **Two Tongues Showdown**: English against Tagalog, matching the two versions of a verse; for
    friends and families who read both.
  - **Who Kept This?**: a friend's card or note without the name; guess which friend kept it.
  - **Draw the Verse** (just for fun): one player gets a verse or passage (the Good Samaritan,
    Jonah and the fish, Psalm 23) and draws hints on a shared canvas, no letters or numbers; the
    others guess the reference or the story, with points for guessing fast and to the drawer when
    someone gets it. Rounds pass around the group. Needs a live room (Supabase Realtime can carry
    the strokes and guesses), a drawing canvas with a few colors and an eraser, and a list of
    drawable passages by difficulty (easy stories to hard single verses). Could run as a party
    game on one phone passed around, too.
  Live ones need rooms and presence (Supabase Realtime); the turn-based ones can start on
  ordinary saved rows.
- In place: sign-ups (email and Google), usernames, friends, and per-card visibility (only me / friends / everyone).

## Smarter games with AI

Built in 0.18.0 (`lib/games/ai`): a free fill-mask model from Hugging Face (DistilBERT for English,
XLM-RoBERTa for Tagalog), run on the server with Transformers.js, reads each verse with one word
hidden and suggests words that fit. Filtered to real Bible words (no names, no other forms of the
answer), they're saved per verse text in `verse_alternatives` and used for Fill the Blanks decoys
and Spot the Change swaps, with the old word lists as the fallback. Work happens after a verse is
saved and in a daily catch-up cron (`/api/cron/alternatives`). `KEPT_AI=off` turns it off.

Next:

- Missing Word could hint with a word that fits when a guess is far off.
- Better Tagalog: XLM-RoBERTa guesses whole words less often than DistilBERT does in English.

## Reminders and connections

- **Push notifications** (planned): the installed app (PWA) reminds you when verses are due for
  review, when the day's games are ready, and when a friend sends a request or likes a card. Uses
  Web Push from the service worker (VAPID keys, a `push_subscriptions` table per device), sent from
  a cron at each person's own time of day, so their time zone needs saving on the account (today
  it's only a cookie, lib/day.ts). iPhone needs Kept added to the
  Home Screen first (iOS 16.4+). Each kind can be turned off in Settings.
- **Email notifications** (planned): the same reminders by email for people who don't install the
  app, plus a weekly summary (verses kept, streak, what's due). Sent through a provider such as
  Resend or Postmark, with a one-tap unsubscribe per kind and a quiet default (weekly, not daily).
- **MCP** (planned): `/api/mcp` so Claude and other AI assistants can read and update your verses
  (keep a verse, see what's due, add a note, quiz you). The route and its `MCP_TOKEN` bearer check
  are already reserved (lib/supabase/proxy.ts); next is per-user tokens (Settings → Connections)
  instead of one shared token, then OAuth so an assistant can connect without copying a token.

## Support and Premium

- **Support Kept**: built (0.18.3). Settings → Support Kept: a Give link (`SUPPORT_URL`, e.g.
  Ko-fi), an optional GCash/Maya QR (`SUPPORT_QR`), and Share Kept. Tips only, nothing unlocked.
  The admin dashboard counts page opens and taps on Give and Share (`app_events`), and Ko-fi tips
  arrive through its webhook (`/api/ko-fi`, `KOFI_VERIFICATION_TOKEN`) into `tips`, matched to an
  account by email. GCash/Maya QR tips can't report themselves; a manual "Add tip" form could.
- **Premium** (planned): memorizing stays free (keeping verses, reviews, the daily games). Paid
  extras on top:
  - **Premium games**: new game types beyond the free daily set.
  - **Auto-designed cards**: one tap turns a verse into a card with a random design (background,
    type, layout), and you can shuffle until one fits.
  - **Multiplayer games** (maybe premium, maybe free with premium modes; see Social).
- Needs real payments first (the Ko-fi webhook and `tips` table are a start): a processor that
  takes GCash, Maya and cards (PayMongo, or Stripe where it's available), a webhook that records who paid, and a per-user entitlement
  (`profiles.plan` or a `subscriptions` table) that premium features check. Monthly and yearly,
  maybe lifetime. Supporters who tipped before launch could get a thank-you (badge or a free
  month).
- If Kept is ever wrapped for the App Store or Play Store, their in-app purchase rules apply to
  premium; on the web (PWA) they don't.

## Before deploying

- Card photos and profile pictures are in Vercel Blob (done in 0.17): set `BLOB_READ_WRITE_TOKEN`
  in the production environment too.
- The word model downloads into `/tmp` on first use (about 67 MB English, 280 MB Tagalog), so the
  first background run after a cold start takes longer.
- Set `ADMIN_EMAILS` (the dashboard) and `SITE_URL` in the production environment.
