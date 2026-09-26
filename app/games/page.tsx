import type { Metadata } from "next";
import Link from "next/link";
import { Check, Flame, X } from "lucide-react";
import { GameIcon } from "@/components/game-icons";
import { Screen } from "@/components/screen";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { today } from "@/lib/day";
import { getOrCreateDay, streak } from "@/lib/games/daily";
import { GAMES, type GameId } from "@/lib/games/registry";
import { hasStarted, resultLabel } from "@/lib/games/summary";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Games" };

// Why a game isn't on today's shelf (the verses don't fit it yet).
const UNAVAILABLE: Partial<Record<GameId, string>> = {
  match_up: "Needs 2 verses",
  two_tongues: "Needs ESV or MBBTAG",
  unscramble: "Needs a longer verse",
  first_letters: "Needs a longer verse",
  missing_word: "Needs a longer word",
  spot_change: "Needs a longer verse",
};

export default async function GamesPage() {
  const user = await requireUser();
  const day = await today();
  const [games, days] = await Promise.all([getOrCreateDay(user.id, day), streak(user.id, day)]);
  const done = games.filter((g) => g.status !== "in_progress").length;
  const dateLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Screen back={{ href: "/", label: "Home" }} title="Today's games" subtitle={dateLabel}>
      {games.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="max-w-xs text-muted-foreground">Games are made from your saved verses. Add one to start.</p>
          <Link href="/verses/new" transitionTypes={["nav-forward"]} className={cn(buttonVariants(), "h-11 px-5 text-base")}>
            Add a verse
          </Link>
        </section>
      ) : (
        <>
          <p className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {done} of {games.length} done
            </span>
            {days > 0 && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <Flame className="size-4 text-icon-accent" aria-hidden /> {days}-day streak
              </span>
            )}
          </p>

          {/* App grid: icon tile, name, and today's status underneath. */}
          <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4">
            {GAMES.map((info, i) => {
              const game = games.find((g) => g.game === info.id);
              const result = game ? resultLabel(game) : null;
              const status = !game
                ? (UNAVAILABLE[info.id] ?? "Not today")
                : (result ?? (hasStarted(game) ? "Continue" : "Play"));
              return (
                <li key={info.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link
                    href={`/games/${info.slug}`}
                    transitionTypes={["nav-forward"]}
                    aria-label={`${info.name}: ${status}`}
                    className={cn("group flex flex-col items-center text-center", !game && "opacity-45")}
                  >
                    <span className="relative flex aspect-square w-full max-w-24 items-center justify-center rounded-[26%] bg-icon-tile transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95">
                      <GameIcon game={info.id} className="size-[68%]" />
                      {game && game.status !== "in_progress" && (
                        <span
                          className={cn(
                            "absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-2 border-background",
                            game.status === "won" ? "bg-primary text-primary-foreground" : "bg-muted-foreground text-background",
                          )}
                        >
                          {game.status === "won" ? (
                            <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          ) : (
                            <X className="size-3.5" strokeWidth={3} aria-hidden />
                          )}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 line-clamp-2 text-sm font-medium leading-tight">{info.name}</span>
                    <span
                      className={cn(
                        "mt-0.5 text-xs",
                        game && game.status === "in_progress" ? "font-medium text-primary" : "text-muted-foreground",
                      )}
                    >
                      {status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Screen>
  );
}
