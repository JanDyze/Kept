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
- **Multiplayer games** (soon): head-to-head and challenge modes — two friends play the same
  puzzle (same seed) and compare, or race live on one verse. The daily puzzle builders already take
  a seed, so a shared "puzzle of the day" can reuse them.
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

## Before deploying

- Card photos and profile pictures are in Vercel Blob (done in 0.17): set `BLOB_READ_WRITE_TOKEN`
  in the production environment too.
- The word model downloads into `/tmp` on first use (about 67 MB English, 280 MB Tagalog), so the
  first background run after a cold start takes longer.
- Set `ADMIN_EMAILS` (the dashboard) and `SITE_URL` in the production environment.
