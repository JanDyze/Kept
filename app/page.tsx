import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { BibleIcon, DiscoverIcon, GamesIcon, SettingsIcon, VersesIcon } from "@/components/home-icons";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { getTimeZone, localDate } from "@/lib/day";
import { getOrCreateDay, streak } from "@/lib/games/daily";
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
  const [games, days, counts] = await Promise.all([getOrCreateDay(user.id, day), streak(user.id, day), verseCounts(user.id)]);
  const done = games.filter((g) => g.status !== "in_progress").length;
  const allDone = games.length > 0 && done === games.length;

  // The today card opens Progress (or Add verse when there's nothing to track yet).
  const todayHref = games.length === 0 ? "/verses/new" : "/stats";

  // Plain surfaces; the hand-drawn icons carry the color.
  const cards = [
    {
      href: "/games",
      title: "Games",
      detail: games.length === 0 ? "Unlocks with your first verse" : allDone ? "All done today" : `${games.length - done} left today`,
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
      href: "/settings",
      title: "Settings",
      detail: "Account and app",
      Icon: SettingsIcon,
    },
  ];

  // Takes 80% of the visible height (dvh follows mobile browser bars): the today card and
  // Discover keep their size, the four cards share what's left.
  return (
    <Screen header={false} className="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex h-[80dvh] min-h-[30rem] flex-col gap-3">
        <Link
          href={todayHref}
          transitionTypes={["nav-forward"]}
          aria-label={games.length === 0 ? "Add your first verse" : `${done} of ${games.length} games done today. View your progress`}
          className={cn(
            "animate-rise group relative block shrink-0 overflow-hidden rounded-2xl bg-brand p-5 text-brand-foreground",
            "transition-transform duration-200 ease-out active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <Image
            src="/logo.svg"
            alt=""
            width={200}
            height={200}
            className="pointer-events-none absolute -right-12 -top-10 rotate-12 opacity-[0.12] brightness-0 invert transition-transform duration-700 ease-out motion-safe:group-engaged:rotate-[24deg] motion-safe:group-engaged:scale-110"
          />
          <p className="flex items-center gap-2 text-sm text-brand-foreground/75">
            <Image src="/logo-animated.svg" alt="" width={22} height={22} unoptimized className="brightness-0 invert" />
            <span className="font-brand text-base font-semibold text-brand-foreground">Kept</span>
            <span aria-hidden>·</span>
            {greeting(tz)}
          </p>
          {games.length === 0 ? (
            <>
              <h1 className="mt-1 font-brand text-3xl font-semibold leading-tight">Start with one verse</h1>
              <p className="mt-1 max-w-xs text-sm text-brand-foreground/80">
                Save a verse you want to keep, and today&apos;s games will be ready.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-1 font-brand text-3xl font-semibold leading-tight">
                {allDone ? "All kept for today" : "Today's games"}
              </h1>
              <div className="mt-3 flex items-center gap-1.5" aria-hidden>
                {games.map((g) => (
                  <span
                    key={g.id}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      g.status === "in_progress" ? "bg-brand-foreground/25" : "bg-brand-foreground",
                    )}
                  />
                ))}
              </div>
            </>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-3 text-brand-foreground/80">
              {games.length > 0 && (
                <span>
                  {done} of {games.length} done
                </span>
              )}
              {days > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-brand-foreground">
                  <Flame className="size-4 text-icon-accent" aria-hidden /> {days}-day streak
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-0.5 font-medium">
              {games.length === 0 ? "Add a verse" : "Progress"}
              <ChevronRight
                className="size-4 transition-transform duration-300 motion-safe:group-engaged:translate-x-1"
                aria-hidden
              />
            </span>
          </div>
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

        <Link
          href="/search"
          transitionTypes={["nav-forward"]}
          style={{ animationDelay: "260ms" }}
          className={cn(
            "animate-rise group flex shrink-0 items-center gap-3.5 rounded-2xl border bg-card px-4 py-3",
            "transition-[transform,background-color,border-color] duration-200 ease-out hover:border-foreground/15 hover:bg-muted/40 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-icon-tile">
          <DiscoverIcon className="size-[70%]" />
        </span>
          <span className="min-w-0 flex-1">
            <span className="block font-brand text-lg font-semibold leading-tight tracking-tight">Discover</span>
            <span className="block truncate text-sm text-muted-foreground">Verses for every season of life</span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-safe:group-engaged:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </Screen>
  );
}
