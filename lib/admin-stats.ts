import "server-only";
import { sql } from "drizzle-orm";
import { addDays } from "@/lib/day";
import { db } from "@/lib/db";
import { GAME_IDS, type GameId } from "@/lib/games/registry";

// Numbers for the admin dashboard, across every account. "Active" means anything a person did:
// opened a screen (app_events, from 0.14.0), played, practiced or kept a verse, so days before
// page views were recorded still count.

const ACTIVITY = sql`
  select user_id, created_at as ts from app_events
  union all select user_id, created_at from daily_games
  union all select user_id, finished_at from daily_games where finished_at is not null
  union all select user_id, reviewed_at from reviews
  union all select user_id, created_at from verses`;

const DAYS = 30;

export type DayCount = { day: string; value: number };

function fillDays(rows: { day: string; n: number }[], today: string, days = DAYS): DayCount[] {
  const byDay = new Map(rows.map((r) => [r.day, Number(r.n)]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    return { day, value: byDay.get(day) ?? 0 };
  });
}

export async function adminStats(tz: string, today: string) {
  const since = addDays(today, -DAYS + 1);
  const [active, activeByDay, users, signupsByDay, totals, games, pages, keptVerses, recent, support, tipTotals, recentTips] = await Promise.all([
    db.execute<{ today: number; week: number; month: number }>(sql`
      with act as (${ACTIVITY})
      select
        count(distinct user_id) filter (where (ts at time zone ${tz})::date = ${today}::date)::int as today,
        count(distinct user_id) filter (where ts >= now() - interval '7 days')::int as week,
        count(distinct user_id) filter (where ts >= now() - interval '30 days')::int as month
      from act where ts >= now() - interval '31 days'`),
    db.execute<{ day: string; n: number }>(sql`
      with act as (${ACTIVITY})
      select (ts at time zone ${tz})::date::text as day, count(distinct user_id)::int as n
      from act where (ts at time zone ${tz})::date >= ${since}::date
      group by 1`),
    db.execute<{ total: number; week: number }>(sql`
      select count(*)::int as total, count(*) filter (where created_at >= now() - interval '7 days')::int as week
      from auth.users`),
    db.execute<{ day: string; n: number }>(sql`
      select (created_at at time zone ${tz})::date::text as day, count(*)::int as n
      from auth.users where (created_at at time zone ${tz})::date >= ${since}::date
      group by 1`),
    db.execute<Record<string, number>>(sql`
      select
        (select count(*) from verses where archived_at is null)::int as verses,
        (select count(*) from verses where archived_at is null and card is not null)::int as cards,
        (select count(*) from verses where archived_at is null and visibility <> 'private')::int as shared,
        (select count(*) from verses where share_token is not null)::int as links,
        (select count(*) from daily_games where status <> 'in_progress')::int as games,
        (select count(*) from daily_games where status = 'won')::int as won,
        (select count(*) from reviews)::int as reviews,
        (select count(*) from friendships where status = 'accepted')::int as friendships,
        (select count(*) from card_likes)::int + (select count(*) from verse_likes)::int as likes,
        (select count(*) from verse_notes)::int as notes,
        (select count(*) from card_images)::int as photos,
        (select count(*) from app_events where kind = 'view' and created_at >= now() - interval '7 days')::int as views`),
    db.execute<{ game: GameId; played: number; won: number; people: number }>(sql`
      select game, count(*) filter (where status <> 'in_progress')::int as played,
        count(*) filter (where status = 'won')::int as won,
        count(distinct user_id) filter (where status <> 'in_progress')::int as people
      from daily_games where day >= ${since}
      group by game`),
    db.execute<{ path: string; views: number; people: number }>(sql`
      select path, count(*)::int as views, count(distinct user_id)::int as people
      from app_events where kind = 'view' and created_at >= now() - interval '7 days'
      group by path order by views desc limit 12`),
    db.execute<{ reference: string; people: number }>(sql`
      select mode() within group (order by reference) as reference, count(distinct user_id)::int as people
      from verses where archived_at is null
      group by book_number, chapter, verse_start
      order by people desc, reference limit 8`),
    db.execute<{
      id: string;
      email: string | null;
      created_at: string;
      username: string | null;
      display_name: string | null;
      last_active: string | null;
      verses: number;
      games: number;
      provider: string | null;
      supporter: boolean;
    }>(sql`
      with act as (${ACTIVITY}),
      seen as (select user_id, max(ts) as ts from act group by user_id)
      select u.id, u.email, u.created_at::text, p.username, p.display_name, seen.ts::text as last_active,
        u.raw_app_meta_data->>'provider' as provider,
        exists (select 1 from tips t where t.email = lower(u.email)) as supporter,
        (select count(*) from verses v where v.user_id = u.id and v.archived_at is null)::int as verses,
        (select count(*) from daily_games g where g.user_id = u.id and g.status <> 'in_progress')::int as games
      from auth.users u
      left join profiles p on p.user_id = u.id
      left join seen on seen.user_id = u.id
      order by coalesce(seen.ts, u.created_at) desc
      limit 30`),
    // Support page: opens, and taps on Give and Share Kept.
    db.execute<{ kind: string; week: number; month: number; people: number }>(sql`
      select kind,
        count(*) filter (where created_at >= now() - interval '7 days')::int as week,
        count(*)::int as month,
        count(distinct user_id)::int as people
      from app_events
      where created_at >= now() - interval '30 days'
        and (kind in ('support_give', 'support_share') or (kind = 'view' and path = '/settings/support'))
      group by kind`),
    db.execute<{ currency: string; total: number; month: number; tips: number; people: number }>(sql`
      select currency, sum(amount_cents)::int as total,
        coalesce(sum(amount_cents) filter (where paid_at >= now() - interval '30 days'), 0)::int as month,
        count(*)::int as tips,
        count(distinct coalesce(email, from_name, external_id))::int as people
      from tips group by currency order by total desc`),
    db.execute<{
      id: string;
      from_name: string | null;
      message: string | null;
      amount_cents: number;
      currency: string;
      monthly: boolean;
      paid_at: string;
      username: string | null;
    }>(sql`
      select t.id, t.from_name, t.message, t.amount_cents, t.currency, t.monthly, t.paid_at::text, p.username
      from tips t
      left join auth.users u on lower(u.email) = t.email
      left join profiles p on p.user_id = u.id
      order by t.paid_at desc limit 10`),
  ]);

  const byGame = new Map(games.map((g) => [g.game, g]));
  return {
    active: active[0] ?? { today: 0, week: 0, month: 0 },
    activeByDay: fillDays(activeByDay, today),
    users: users[0] ?? { total: 0, week: 0 },
    signupsByDay: fillDays(signupsByDay, today),
    totals: totals[0] ?? {},
    games: GAME_IDS.map((id) => ({ id, played: 0, won: 0, people: 0, ...byGame.get(id) })),
    pages,
    keptVerses,
    recent,
    support: {
      opens: support.find((r) => r.kind === "view") ?? { week: 0, month: 0, people: 0 },
      gives: support.find((r) => r.kind === "support_give") ?? { week: 0, month: 0, people: 0 },
      shares: support.find((r) => r.kind === "support_share") ?? { week: 0, month: 0, people: 0 },
      tipTotals,
      recentTips,
    },
  };
}
