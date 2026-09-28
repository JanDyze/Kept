# Roadmap

Planned, not built yet. Kept is growing from a personal tool into an app many people share.

## Discover, shaped by everyone

Discover (`/search`) keeps today's defaults (topics from the OpenBible.info Topical Bible, and
search by topic, feeling or wording). Once there are enough users, it also shows what the
community keeps:

- **Most saved verses** across all users.
- **Most used tags**, as a consensus of how people group their verses.
- **A gallery of cards**: everyone's customized verse cards in a Pinterest-style masonry grid
  (portrait, square and landscape cards side by side), to browse, save from, and use as a starting
  style for your own. This needs cards to be shareable (public by choice) and photos stored in the
  cloud, not on the dev machine.

## Social

- Friends, challenges, head-to-head games and leaderboards. The daily puzzle builders already take
  a seed, so a shared "puzzle of the day" can reuse them.
- Prerequisites: open sign-ups, profiles and usernames, and privacy controls for anything shared.

## Before deploying

- Card photos are stored on local disk (`data/card-images`). Swap `lib/cards/storage.ts` for
  object storage (e.g. Vercel Blob) first.
