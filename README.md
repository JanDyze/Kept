# Kept

A personal Bible verse memorization app: save verses, play daily games built from them, and let a spaced-repetition schedule decide which verses come back when. Claude can read and update them over MCP.

## What's in it

- **Home**: today's games progress and streak, plus cards for Games, My verses, Bible and Settings.
- **Games** (`/games`): four daily puzzles from your own verses, each playable once a day.
  - *Fill the Blanks* and *Unscramble* are recall games: finishing one rates each verse (0 mistakes = Good, 1–2 = Hard, 3+ or give up = Again) and moves its ts-fsrs review schedule.
  - *Missing Word* (Wordle) and *Reference* (guess book, chapter, verse) are for fun and don't touch the schedule.
  - Puzzles are built and saved the first time a day is opened (`daily_games`), so they stay the same across devices. The day follows the phone's time zone.
- **My verses** (`/verses`): Bible-order list, tag filter, archive. ESV and MBBTAG text is locked to your imported copy.
- **Bible** (`/bible`): read any chapter in ESV or MBBTAG, tap verses, and keep them.
- **Find verses** (`/search`): search a topic, feeling or occasion ("depression", "birthdays", "mothers"), in English or common Tagalog words ("kaarawan", "nanay"), plus exact wording. Topics come from the [OpenBible.info Topical Bible](https://www.openbible.info/topics/) (CC BY 4.0); load them once with `npm run topics:import`.
- **Themes** (Settings): Kept's own navy look, or one of the [goodthemes](../goodthemes) themes (First Garden, Exile, Great Flood, ... Pearl Gates), each with its own colors, type, texture, switch animation and optional moving scenery. The choice is saved on the device.

What comes next is in [ROADMAP.md](ROADMAP.md).

Next.js (App Router) · Supabase (Postgres + Auth) · Drizzle · Tailwind + shadcn/ui · ts-fsrs · Vercel

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. **Google sign-in** (the only way in): in Google Cloud Console, create an OAuth client (Web application) with the redirect URI shown under **Authentication → Sign In / Providers → Google** in Supabase (`https://<project>.supabase.co/auth/v1/callback`), publish the consent screen, then paste its Client ID and secret into that Supabase panel and enable it.
3. **Authentication → Sign In / Providers → Email**: turn "Enable email provider" **off** (Kept has no email/password form; leaving it on would still let someone sign up through Supabase's API directly).
4. **Authentication → Sign In / Providers → User Signups**: turn **on** "Allow new users to sign up" (a first Google sign-in makes the account).
5. **Authentication → URL Configuration**: set the Site URL to where Kept runs, and add each address you open it from to **Redirect URLs** (e.g. `http://localhost:3000/**`, `http://192.168.1.10:3000/**`, your production domain). Google sign-in returns through `/auth/confirm`.

### 2. Environment

```sh
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → Publishable key |
| `DATABASE_URL` | Connect → Transaction pooler (port 6543) |
| `DIRECT_URL` | Connect → Session pooler (port 5432) |
| `CRON_SECRET` | Any long random string |
| `MCP_TOKEN` | Any long random string (used from Day 5) |
| `SITE_URL` | Production only: the address Kept is reached at, e.g. `https://kept.example.com` (sign-up and Google sign-in return there) |

Generate random strings with `node -e "console.log(crypto.randomBytes(32).toString('base64url'))"`.

### 3. Database

```sh
npm run db:migrate
```

This creates the `verses`, `reviews` and `bible_verses` tables with row level security on and no policies. The app reaches them through Drizzle, and Supabase's public API can't.

### 4. Bible text (for auto-fill)

```sh
npm run bible:import
```

Loads the local `ESV/` and `MBBTAG/` copies into `bible_verses` so the add-verse form can fill in text. Safe to re-run. Where MBBTAG prints several verses as one, a lookup widens the reference to the whole passage. Verses ESV leaves out (like Acts 8:37) are reported as missing.

### 5. Run

```sh
npm run dev
```

Open http://localhost:3000 and sign in.

## Install as an app (PWA)

Kept installs to a phone's home screen and opens in its own window (`app/manifest.ts`, icons in
`public/icons/`). A service worker (`public/sw.js`, production builds only) keeps the app's files
and shows `public/offline.html` when there's no connection; pages with your data are never stored.

- **Android (Chrome):** open Kept over **HTTPS** (e.g. once it's deployed) → menu → *Install app*.
  Over plain `http://192.168.x.x` it won't offer installing; for a local test use
  `next dev --experimental-https`.
- **iPhone (Safari):** Share → *Add to Home Screen*.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (the build also runs them, so a deploy brings the database up to date first) |
| `npm run db:studio` | Browse the database |
| `npm run bible:import` | Load ESV and MBBTAG text for auto-fill |
| `npm run topics:import` | Load the OpenBible topic data for search (re-run to refresh) |
| `npm run themes:update` | Rebuild `../goodthemes` and reinstall it from `vendor/goodthemes.tgz` |
| `npm test` | Unit tests for game rules and scheduling (Vitest) |

Adding a game: write its rules in `lib/games/<game>.ts` (pure and tested), a screen in `components/games/`, its puzzle builder in `lib/games/daily.ts`, and a line in `lib/games/registry.ts`.

## Deploy (Vercel)

1. Push to a **private** GitHub repo and import it in Vercel.
2. Add the same environment variables in Vercel → Settings → Environment Variables.
3. `vercel.json` schedules `/api/cron/keepalive` daily so the free Supabase project isn't paused, and pins functions to `bom1` (Mumbai), next to the Supabase database, since every page makes database round trips.

## Access rules

- Every page needs a session except `/login`, `/api/mcp` and `/api/cron/*`.
- `proxy.ts` redirects signed-out visitors early. Pages and server actions check again with `requireUser()` from `lib/auth.ts`, and every query filters by that user's id.
- `/api/cron/*` requires `Authorization: Bearer $CRON_SECRET`. `/api/mcp` will require `Authorization: Bearer $MCP_TOKEN`.

## Bible text

`ESV/` and `MBBTAG/` hold personal copies of copyrighted translations. They're gitignored and must never be committed or published.
