import type { Metadata } from "next";
import { ColumnChart } from "@/components/admin/column-chart";
import { Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import { adminStats } from "@/lib/admin-stats";
import { APP_VERSION } from "@/lib/changelog";
import { getTimeZone, localDate } from "@/lib/day";
import { gameById } from "@/lib/games/registry";

export const metadata: Metadata = { title: "Dashboard" };

const compact = (n: number) => (n >= 10_000 ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n) : n.toLocaleString());

function ago(iso: string | null) {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

// How Kept is used, across every account (ADMIN_EMAILS only; everyone else gets a 404).
export default async function AdminPage() {
  await requireAdmin();
  const tz = await getTimeZone();
  const today = localDate(tz);
  const s = await adminStats(tz, today);
  const t = s.totals;

  const tiles = [
    { label: "People", value: s.users.total, note: s.users.week ? `+${s.users.week} this week` : undefined },
    { label: "Active this week", value: s.active.week },
    { label: "Active this month", value: s.active.month },
    { label: "Verses kept", value: t.verses ?? 0 },
    { label: "Games finished", value: t.games ?? 0, note: t.games ? `${Math.round(((t.won ?? 0) / t.games) * 100)}% won` : undefined },
    { label: "Visits, 7 days", value: t.visits ?? 0, note: t.views ? `${compact(t.views)} screens opened` : undefined },
  ];
  const more = [
    ["Cards made", t.cards],
    ["Cards shown to others", t.shared],
    ["Public links", t.links],
    ["Reviews", t.reviews],
    ["Friendships", t.friendships],
    ["Likes", t.likes],
    ["Notes", t.notes],
    ["Photos", t.photos],
  ] as const;

  return (
    <Screen back={{ href: "/settings", label: "Settings" }} title="Dashboard" subtitle={`Kept ${APP_VERSION} · ${tz}`}>
      <section aria-label="Active today" className="rounded-2xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Active today</p>
        <p className="mt-1 font-sans text-5xl font-semibold tracking-tight">{s.active.today.toLocaleString()}</p>
        <div className="mt-5">
          <ColumnChart data={s.activeByDay} unit={["person", "people"]} label="People active per day, last 30 days" />
        </div>
      </section>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((x) => (
          <div key={x.label} className="rounded-2xl border bg-card px-4 py-3.5">
            <dt className="text-sm text-muted-foreground">{x.label}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight">{compact(x.value)}</dd>
            {x.note && <dd className="text-xs text-muted-foreground">{x.note}</dd>}
          </div>
        ))}
      </dl>

      <Section title="Sign-ups, last 30 days">
        <div className="rounded-2xl border bg-card p-4">
          <ColumnChart data={s.signupsByDay} unit={["sign-up", "sign-ups"]} label="Sign-ups per day, last 30 days" />
        </div>
      </Section>

      <Section title="Games, last 30 days">
        <Table
          head={["Game", "Finished", "Won", "People"]}
          rows={s.games.map((g) => [
            gameById(g.id).name,
            g.played.toLocaleString(),
            g.played ? `${Math.round((g.won / g.played) * 100)}%` : "—",
            g.people.toLocaleString(),
          ])}
        />
      </Section>

      <Section title="Screens opened, last 7 days">
        {s.pages.length ? (
          <Table head={["Screen", "People", "Opened"]} rows={s.pages.map((p) => [p.path, p.people.toLocaleString(), p.views.toLocaleString()])} mono />
        ) : (
          <Empty>No views recorded yet.</Empty>
        )}
      </Section>

      <Section title="Support">
        <Table
          head={["Support page", "7 days", "30 days", "People"]}
          rows={(
            [
              ["Opened", s.support.opens],
              ["Saved QR or gave", s.support.gives],
              ["Shared Kept", s.support.shares],
            ] as const
          ).map(([label, x]) => [label, x.week.toLocaleString(), x.month.toLocaleString(), x.people.toLocaleString()])}
        />
      </Section>

      <Section title="Most kept verses">
        {s.keptVerses.length ? (
          <Table head={["Verse", "People"]} rows={s.keptVerses.map((v) => [v.reference, v.people.toLocaleString()])} />
        ) : (
          <Empty>No verses yet.</Empty>
        )}
      </Section>

      <Section title="Everything">
        <dl className="grid grid-cols-2 divide-y rounded-2xl border bg-card sm:grid-cols-4 sm:divide-y-0">
          {more.map(([label, n]) => (
            <div key={label} className="px-4 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-semibold tabular-nums">{(n ?? 0).toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="People, most recently active">
        <ul className="divide-y rounded-2xl border bg-card">
          {s.recent.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.display_name ?? (u.username ? `@${u.username}` : "No profile yet")}
                  {u.username && u.display_name && <span className="ml-1.5 text-sm font-normal text-muted-foreground">@{u.username}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email ?? "—"}
                  {u.provider && u.provider !== "email" && ` · ${u.provider}`} · joined {ago(u.created_at)} ago
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                <p>
                  {u.verses} v · {u.games} g
                </p>
                <p>{ago(u.last_active)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-7">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground ${className ?? ""}`}>{children}</p>;
}

function Table({ head, rows, mono }: { head: string[]; rows: string[][]; mono?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} scope="col" className={i === 0 ? "px-4 py-2 font-medium" : "px-3 py-2 text-right font-medium"}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, i) => (
                <td key={i} className={i === 0 ? `max-w-0 truncate px-4 py-2 ${mono ? "font-mono text-[0.8rem]" : ""}` : "w-20 px-3 py-2 text-right tabular-nums"}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
