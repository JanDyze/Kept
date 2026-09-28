# Roadmap

Planned, not built yet. Kept is growing from a personal tool into an app many people share.

## Discover, shaped by everyone

Discover (`/search`) keeps today's defaults (topics from the OpenBible.info Topical Bible, and
search by topic, feeling or wording). Once there are enough users, it also shows what the
community keeps:

- **Most saved verses** across all users.
- **Most used tags**, as a consensus of how people group their verses.
- **A gallery of cards**: built (Discover → Cards, Pinterest-style). Next: search and tags within
  the gallery, and loading more than the newest 60. Photos still need cloud storage before deploying.

## Social

- Friends: built (usernames, requests, profiles at `/u/name`, friends-only cards).
- Challenges, head-to-head games and leaderboards. The daily puzzle builders already take
  a seed, so a shared "puzzle of the day" can reuse them.
- In place: sign-ups (email and Google), usernames, friends, and per-card visibility (only me / friends / everyone).

## Before deploying

- Card photos are stored on local disk (`data/card-images`). Swap `lib/cards/storage.ts` for
  object storage (e.g. Vercel Blob) first.
