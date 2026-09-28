import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BibleIcon, DiscoverIcon, GamesIcon, VersesIcon } from "@/components/home-icons";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { getTimeZone, localDate } from "@/lib/day";
import { getOrCreateDay, streak } from "@/lib/games/daily";
import { getOrCreateProfile } from "@/lib/social/profiles";
import { verseCounts } from "@/lib/verses/queries";
import { cn } from "@/lib/utils";

function greeting(tz: string) {
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const user = await requireUser();
  const tz = await getTimeZone();
  const day = localDate(tz);
  const [games, days, counts, me] = await Promise.all([
    getOrCreateDay(user.id, day),
    streak(user.id, day),
    verseCounts(user.id),
    getOrCreateProfile(user),
  ]);
  const done = games.filter((g) => g.status !== "in_progress").length;
  const allDone = games.length > 0 && done === games.length;

  const left = games.length - done;
  const firstName = (me.displayName ?? "").split(/\s+/)[0] || `@${me.username}`;

  // The top card is you: greeting, streak and today's games; it opens your profile (or Add verse
  // when there's nothing to play yet).
  const youHref = games.length === 0 ? "/verses/new" : `/u/${me.username}`;
  const status =
    games.length === 0 ? "Start with one verse" : allDone ? "All kept for today" : `${left} ${left === 1 ? "game" : "games"} left today`;

  // Plain surfaces; the hand-drawn icons carry the color.
  const cards = [
    {
      href: "/games",
      title: "Games",
      // today's count lives on the top card; this one just says what's here
      detail: games.length === 0 ? "Unlocks with your first verse" : allDone ? "Play again for practice" : "Today's puzzles",
      Icon: GamesIcon,
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
      detail: "Cards and verses",
      Icon: DiscoverIcon,
    },
  ];

  // Takes 80% of the visible height (dvh follows mobile browser bars): the top card keeps its
  // size, the four cards share what's left. With a mouse (desktop) the
  // window can be far taller than a phone, so the cards stop growing at a phone-like height.
  return (
    <Screen header={false} className="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex h-[80dvh] min-h-[30rem] flex-col gap-3 pointer-fine:max-h-[37rem]">
        <Link
          href={youHref}
          transitionTypes={["nav-forward"]}
          aria-label={games.length === 0 ? "Add your first verse" : `${status}. Your profile`}
          className={cn(
            "animate-rise group relative isolate block shrink-0 overflow-hidden rounded-2xl bg-brand p-5 text-brand-foreground",
            "transition-transform duration-200 ease-out active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          {/* the Kept mark, large and faint in the corner; it turns a little when the card is pressed */}
          <Image
            src="/logo.svg"
            alt=""
            width={190}
            height={190}
            className="pointer-events-none absolute -right-10 -bottom-14 -z-10 rotate-12 opacity-[0.13] brightness-0 invert transition-transform duration-700 ease-out motion-safe:group-engaged:rotate-[24deg] motion-safe:group-engaged:scale-110"
          />
          <div className="flex items-center gap-3">
            <Avatar name={me.displayName} username={me.username} src={me.avatarUrl} eager className="size-11 text-lg ring-2 ring-brand-foreground/25" />
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

        <nav className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3" aria-label="Sections">
          {cards.map(({ href, title, detail, Icon }, i) => (
            <Link
              key={href}
              href={href}
              transitionTypes={["nav-forward"]}
              style={{ animationDelay: `${60 + i * 50}ms` }}
              className={cn(
                "animate-rise group flex min-h-[6.5rem] flex-col justify-between rounded-2xl border bg-card p-4",
                "transition-[transform,background-color,border-color] duration-200 ease-out hover:border-foreground/15 hover:bg-muted/40 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              <span className="flex size-[clamp(3.25rem,8.5dvh,4.5rem)] items-center justify-center rounded-2xl bg-icon-tile">
              <Icon className="size-[66%]" />
            </span>
              <div>
                <span className="block font-brand text-lg font-semibold leading-tight tracking-tight">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>
              </div>
            </Link>
          ))}
        </nav>

      </div>
    </Screen>
  );
}
