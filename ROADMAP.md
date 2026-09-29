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

Today every game is deterministic: blanks, swaps and decoys come from word lists and the user's
other verses. That keeps them fair but sometimes easy to see through. Next:

- **Embeddings or an LLM for distractors.** Fill the Blanks and Missing Word get wrong answers
  that fit the sentence (same part of speech, close in meaning), so the right word can't be
  spotted by grammar alone.
- **Spot the Change** swaps in words that are genuinely confusable in context — a near-synonym,
  a plausible tense or number change — generated per verse instead of drawn from a common-word
  list, so it really tests memory.
- Likely via the Vercel AI Gateway, with results cached per verse (puzzles are saved per day
  already), and the deterministic builders kept as the fallback.

## Before deploying

- **Card photos and profile pictures move to Vercel Blob.** Today they're on local disk
  (`data/card-images`); `lib/cards/storage.ts` (putImage / getImage / deleteImage) is the one
  place to swap. Shared cards will need public or signed URLs.
- Set `ADMIN_EMAILS` (the dashboard) and `SITE_URL` in the production environment.
