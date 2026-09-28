import Link from "next/link";
import { Calendar, type LucideIcon } from "lucide-react";
import { GAMES } from "@/lib/games/registry";
import type { progressStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

// Your progress in detail, on your own profile: the last 12 weeks, each game, and your verses
// (most missed and strongest). Only ever shown to you.

// Navy tints, from none to all of the day's games.
const HEAT = ["bg-muted", "bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"];

export function ProgressDetails({ s, day }: { s: Awaited<ReturnType<typeof progressStats>>; day: string }) {
  const weeks = Array.from({ length: s.calendar.length / 7 }, (_, w) => s.calendar.slice(w * 7, w * 7 + 7));
  return (
    <>
      <section className="rounded-2xl border bg-card p-4" aria-labelledby="calendar">
        <div className="flex items-baseline justify-between">
          <h2 id="calendar" className="flex items-center gap-1.5 font-medium">
            <Calendar className="size-4 text-muted-foreground" aria-hidden /> Last 12 weeks
          </h2>
          <p className="text-sm text-muted-foreground">
            {s.daysPlayed} {s.daysPlayed === 1 ? "day" : "days"} · best streak {s.streak.best}
          </p>
        </div>
        <div className="mt-3 flex justify-between gap-1" role="img" aria-label="Games finished per day over the last 12 weeks">
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-1 flex-col gap-1">
              {week.map((c) => (
                <span
                  key={c.day}
                  title={c.future ? undefined : `${c.day}: ${c.games} ${c.games === 1 ? "game" : "games"}`}
                  className={cn(
                    "aspect-square w-full rounded-[4px]",
                    c.future ? "bg-transparent" : HEAT[Math.min(c.games, 4)],
                    c.day === day && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <span className="mr-1">Fewer</span>
          {HEAT.map((h) => (
            <span key={h} className={cn("size-3 rounded-[3px]", h)} aria-hidden />
          ))}
          <span className="ml-1">All 4</span>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="games">
        <h2 id="games" className="mb-2 text-sm font-medium text-muted-foreground">
          Games
        </h2>
        <ul className="divide-y rounded-2xl border bg-card">
          {GAMES.map((g) => {
            const st = s.byGame[g.id];
            const rate = st.played ? Math.round((st.won / st.played) * 100) : null;
            const detail = !st.played
              ? "Not played yet"
              : g.recall
                ? `${st.perfect} perfect of ${st.played}`
                : st.avgGuesses
                  ? `${st.avgGuesses.toFixed(1)} guesses on average`
                  : `${st.played} played`;
            return (
              <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
                {rate !== null && (
                  <div className="w-24 shrink-0 text-right">
                    <p className="text-sm font-medium">{rate}% solved</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6" aria-labelledby="verses">
        <h2 id="verses" className="mb-2 text-sm font-medium text-muted-foreground">
          Verses
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile value={s.verses.practiced} label="practiced in games" />
          <Tile value={s.verses.notPracticed} label="not practiced yet" />
        </div>
      </section>

      {s.missed.length > 0 && (
        <VerseList
          title="Most missed"
          rows={s.missed.map((m) => ({ id: m.verseId, reference: m.reference, translation: m.translation, note: `${m.misses} of ${m.total} missed` }))}
        />
      )}
      {s.strongest.length > 0 && (
        <VerseList
          title="Strongest"
          rows={s.strongest.map((v) => ({
            id: v.id,
            reference: v.reference,
            translation: v.translation,
            note: v.stability >= 1 ? `~${Math.round(v.stability)} ${Math.round(v.stability) === 1 ? "day" : "days"} memory` : "just started",
          }))}
        />
      )}
      {s.gamesPlayed === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          Play today&apos;s games and your progress will show up here.
        </p>
      )}
    </>
  );
}

function Tile({
  icon: Icon,
  tint,
  value,
  label,
  highlight,
}: {
  icon?: LucideIcon;
  tint?: string;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      {Icon && <Icon className={cn("size-5", tint)} aria-hidden />}
      <p className={cn("mt-1 font-brand text-3xl font-semibold leading-none tracking-tight", highlight && "text-primary")}>{value}</p>
      <p className="mt-1 text-xs leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function VerseList({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; reference: string; translation: string; note: string }[];
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="divide-y rounded-2xl border bg-card">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/verses/${r.id}`}
              transitionTypes={["nav-forward"]}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="min-w-0 truncate font-medium">
                {r.reference} <span className="font-normal text-muted-foreground">· {r.translation}</span>
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">{r.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
