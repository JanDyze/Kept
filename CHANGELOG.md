# Changelog

All notable changes to Kept, one version per feature.

## 0.1.0 — Foundation

- Next.js 16 (App Router) with Supabase email/password auth for a single account; `proxy.ts` redirects signed-out visitors and pages re-check the session.
- Drizzle schema and migrations for verses, reviews, Bible text, topics and daily games; row level security on with no policies.
- App shell: sticky title bar, directional page transitions, app-like touch behavior (no long-press menus or text selection), dark mode (System / Light / Dark), and an animated-logo loading overlay with a verse when a page takes over a second.
- Settings page and a daily keep-alive cron for the free Supabase project.
