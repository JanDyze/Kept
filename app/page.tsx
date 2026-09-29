import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { ANIMATED_LOGO_SVG } from "@/components/animated-logo-markup";
import { Avatar } from "@/components/avatar";
import { AppBadge, CountBadge } from "@/components/count-badge";
import { GuestSave } from "@/components/guest-save";
import { BibleIcon, DiscoverIcon, GamesIcon, VersesIcon } from "@/components/home-icons";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { getTimeZone, localDate } from "@/lib/day";
import { getOrCreateDay, streak } from "@/lib/games/daily";
import { pendingRequestCount } from "@/lib/social/friends";
import { getOrCreateProfile, seenVersion } from "@/lib/social/profiles";
import { APP_VERSION, unseenReleases } from "@/lib/changelog";
import { ReleaseNotes } from "@/components/release-notes";
import { WhatsNewSheet } from "@/components/whats-new-sheet";
import { verseCounts, verseForToday } from "@/lib/verses/queries";
import { SKIP_FIRST_VERSE_COOKIE } from "@/lib/verses/view";
import { TextCard } from "@/components/verse-library";
import { bookByName } from "@/lib/bible/books";
import { readCardStyle } from "@/lib/cards/style";
import { cn } from "@/lib/utils";

function greeting(tz: string) {
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Coming back from Save with Google without it working (see /auth/confirm).
const SAVE_MESSAGES = {
  taken: "That Google account already has Kept. You're still a guest here; sign out of guest to use that account instead.",
  cancelled: "Saving with Google was cancelled. You're still a guest.",
  failed: "Saving with Google isn't available right now. Try again in a moment.",
};

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { saved } = await searchParams;
  const user = await requireUser();
  const tz = await getTimeZone();
  const day = localDate(tz);
  const [games, days, counts, me, todays, requests, jar] = await Promise.all([
    getOrCreateDay(user.id, day),
    streak(user.id, day),
    verseCounts(user.id),
    getOrCreateProfile(user),
    verseForToday(user.id),
    pendingRequestCount(user.id),
    cookies(),
  ]);
  // After an update: what changed since the version they last saw (once).
  const seen = await seenVersion(user.id);
  const unseen = seen === APP_VERSION ? [] : await unseenReleases(seen);
  const done = games.filter((g) => g.status !== "in_progress").length;
  const allDone = games.length > 0 && done === games.length;

  const left = games.length - done;
  const tl = todays?.translation === "MBBTAG" ? bookByName(todays.book)?.tl : undefined;
  const firstName = user.guest ? "Guest" : (me.displayName ?? "").split(/\s+/)[0] || `@${me.username}`;

  // The top card is you: greeting, streak and today's games; it opens your profile (or Add verse
  // when there's nothing to play yet, unless they skipped it).
  const addFirst = games.length === 0 && counts.active === 0 && !jar.get(SKIP_FIRST_VERSE_COOKIE);
  const youHref = addFirst ? "/verses/new" : `/u/${me.username}`;
  const status =
    games.length === 0
      ? addFirst
        ? "Start with one verse"
        : "Nothing to play yet"
      : allDone
        ? "All kept for today"
        : `${left} ${left === 1 ? "game" : "games"} left today`;

  // Plain surfaces; the hand-drawn icons carry the color.
  const cards = [
    {
      href: "/games",
      title: "Games",
      // today's count lives on the top card; this one just says what's here
      detail: games.length === 0 ? "Unlocks with your first verse" : allDone ? "Play again for practice" : "Today's puzzles",
      Icon: GamesIcon,
      badge: left,
    },
    {
      href: "/verses",
      title: "My verses",
      detail:
        counts.active === 0
          ? "None saved yet"
          : `${counts.active} ${counts.active === 1 ? "verse" : "verses"}`,
      Icon: VersesIcon,
    },
    {
      href: "/bible",
      title: "Bible",
      detail: "Read, search, keep",
      Icon: BibleIcon,
    },
    {
      href: "/search",
      title: "Discover",
      // Friend requests are reached from Discover (and your profile), so they show here.
      detail: requests > 0 ? `${requests} friend ${requests === 1 ? "request" : "requests"}` : "Cards and verses",
      Icon: DiscoverIcon,
      badge: requests,
    },
  ];

  // You, the four sections (sized to their content, icon and label together), then a verse of
  // yours for today in its card's colors.
  return (
    <Screen header={false} className="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-3">
        <Link
          href={youHref}
          transitionTypes={["nav-forward"]}
          aria-label={addFirst ? "Add your first verse" : `${status}. Your profile`}
          className={cn(
            "animate-rise group relative isolate block shrink-0 overflow-hidden rounded-2xl bg-brand p-5 text-brand-foreground",
            "transition-transform duration-200 ease-out active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          {/* The Kept mark, large and faint in the corner: it weaves in when Home opens, then drifts
              slowly; pressing the card turns it a little. Inline, so it draws with no download. */}
          <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-14 -z-10 size-[190px] animate-drift">
            <div
              className="size-full rotate-12 opacity-[0.13] brightness-0 invert transition-[rotate,scale] duration-700 ease-out motion-safe:group-engaged:rotate-[24deg] motion-safe:group-engaged:scale-110"
              dangerouslySetInnerHTML={{ __html: ANIMATED_LOGO_SVG }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="relative shrink-0">
              <Avatar name={me.displayName} username={me.username} src={me.avatarUrl} eager className="size-11 text-lg ring-2 ring-brand-foreground/25" />
              <CountBadge count={requests} className="-top-1 -right-1 bg-brand-foreground text-brand ring-brand" />
            </span>
            <p className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm text-brand-foreground/70">{greeting(tz)},</span>
              <span className="block truncate font-brand text-lg font-semibold">{firstName}</span>
            </p>
            {days > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-foreground/12 px-2.5 py-1 text-sm font-semibold tabular-nums">
                <Flame className="size-4 text-icon-accent" aria-hidden /> {days}
                <span className="sr-only">-day streak</span>
              </span>
            )}
            <ChevronRight
              className="size-4 shrink-0 text-brand-foreground/60 transition-transform duration-300 motion-safe:group-engaged:translate-x-1"
              aria-hidden
            />
          </div>
          <h1 className="mt-4 font-brand text-2xl leading-tight font-semibold">{status}</h1>
          {games.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5" aria-hidden>
              {games.map((g) => (
                <span
                  key={g.id}
                  className={cn("h-1.5 flex-1 rounded-full", g.status === "in_progress" ? "bg-brand-foreground/25" : "bg-brand-foreground")}
                />
              ))}
            </div>
          )}
        </Link>

        {typeof saved === "string" && saved in SAVE_MESSAGES && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {SAVE_MESSAGES[saved as keyof typeof SAVE_MESSAGES]}
          </p>
        )}
        {user.guest && <GuestSave compact className="animate-rise" />}

        <nav className="grid grid-cols-2 gap-3" aria-label="Sections">
          {cards.map(({ href, title, detail, Icon, badge = 0 }, i) => (
            <Link
              key={href}
              href={href}
              transitionTypes={["nav-forward"]}
              style={{ animationDelay: `${60 + i * 50}ms` }}
              className={cn(
                "animate-rise group flex flex-col gap-3.5 rounded-2xl border bg-card p-4",
                "transition-[transform,background-color,border-color] duration-200 ease-out hover:border-foreground/15 hover:bg-muted/40 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-icon-tile">
                <Icon className="size-[66%]" />
                <CountBadge count={badge} />
              </span>
              <div>
                <span className="block font-brand text-lg font-semibold leading-tight tracking-tight">{title}</span>
                <span className={cn("mt-0.5 block text-sm", badge > 0 && href === "/search" ? "font-medium text-primary" : "text-muted-foreground")}>
                  {detail}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {todays && (
          <section aria-labelledby="today-verse" className="animate-rise mt-3" style={{ animationDelay: "260ms" }}>
            <h2 id="today-verse" className="mb-2 px-0.5 text-sm font-medium text-muted-foreground">
              Verse for today
            </h2>
            <TextCard
              v={{
                id: todays.id,
                reference: todays.reference,
                localReference: tl && tl !== todays.book ? todays.reference.replace(todays.book, tl) : null,
                book: todays.book,
                translation: todays.translation,
                text: todays.text,
                tags: todays.tags,
                card: readCardStyle(todays.card),
              }}
              href={`/verses/${todays.id}`}
            />
          </section>
        )}
      </div>

      {unseen.length > 0 && (
        <WhatsNewSheet version={unseen[0].version} title={unseen[0].title || `Version ${unseen[0].version}`}>
          {unseen.map((r, i) => (
            <section key={r.version} className={cn(i > 0 && "mt-5")}>
              {i > 0 && (
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {r.version} · {r.title}
                </h3>
              )}
              <ReleaseNotes notes={r.notes} />
            </section>
          ))}
        </WhatsNewSheet>
      )}
      <AppBadge count={requests + left} />
    </Screen>
  );
}
