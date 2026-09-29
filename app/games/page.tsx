import type { Metadata } from "next";
import Link from "next/link";
import { Flame } from "lucide-react";
import { GameCard, type GameEntry } from "@/components/games/game-card";
import { Screen } from "@/components/screen";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { today } from "@/lib/day";
import { getOrCreateDay, streak } from "@/lib/games/daily";
import { GAMES } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Games" };

export default async function GamesPage() {
  const user = await requireUser();
  const day = await today();
  const [games, days] = await Promise.all([getOrCreateDay(user.id, day), streak(user.id, day)]);
  const dateLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const entries: GameEntry[] = GAMES.map((info) => ({ info, game: games.find((g) => g.game === info.id) }));
  const toPlay = entries.filter((e) => e.game?.status === "in_progress");
  const done = entries.filter((e) => e.game && e.game.status !== "in_progress");
  const notToday = entries.filter((e) => !e.game);
  const sections = [
    { key: "play", title: "To play", entries: toPlay },
    { key: "done", title: "Done", entries: done },
    { key: "off", title: "Not today", entries: notToday },
  ].filter((s) => s.entries.length > 0);
  let order = 0;

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
          <div className="animate-rise">
            <div className="flex items-end justify-between gap-3">
              <p className="font-brand text-2xl font-semibold leading-tight tracking-tight">
                {toPlay.length === 0 ? (
                  "All done for today"
                ) : (
                  <>
                    <span className="tabular-nums">{done.length}</span>
                    <span className="text-muted-foreground"> of </span>
                    <span className="tabular-nums">{games.length}</span>
                    <span className="text-muted-foreground"> done</span>
                  </>
                )}
              </p>
              {days > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm font-semibold tabular-nums">
                  <Flame className="size-4 text-icon-accent" aria-hidden /> {days}
                  <span className="sr-only">-day streak</span>
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1.5" aria-hidden>
              {games.map((g) => (
                <span key={g.id} className={cn("h-1.5 flex-1 rounded-full", g.status === "in_progress" ? "bg-muted" : "bg-primary")} />
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <section key={section.key} aria-labelledby={`games-${section.key}`} className="mt-7">
              <h2 id={`games-${section.key}`} className="mb-2.5 px-0.5 text-sm font-medium text-muted-foreground">
                {section.title}
              </h2>
              <ul className="flex flex-col gap-3">
                {section.entries.map((entry) => (
                  <li key={entry.info.id} className="animate-rise" style={{ animationDelay: `${60 + order++ * 45}ms` }}>
                    <GameCard {...entry} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </Screen>
  );
}
