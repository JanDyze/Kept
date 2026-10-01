import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import Image from "next/image";
import { ChartColumn, ChevronRight, Palette, Sparkles } from "lucide-react";
import { GuestSave } from "@/components/guest-save";
import { Screen } from "@/components/screen";
import { SignOutForm } from "@/components/sign-out-form";
import { NotificationSettings } from "@/components/notification-settings";
import { TipsSettings } from "@/components/tips-settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAdmin } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { APP_VERSION } from "@/lib/changelog";
import { getTimeZone } from "@/lib/day";
import { db } from "@/lib/db";
import { emailReady } from "@/lib/email";
import { bibleVerses, notificationPrefs } from "@/lib/db/schema";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [tz, copies, [prefs]] = await Promise.all([
    getTimeZone(),
    db
      .select({ translation: bibleVerses.translation, count: sql<number>`count(*)::int` })
      .from(bibleVerses)
      .groupBy(bibleVerses.translation),
    db
      .select({ daily: notificationPrefs.daily, friends: notificationPrefs.friends, updates: notificationPrefs.updates, email: notificationPrefs.email })
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, user.id)),
  ]);

  const links = [
    { href: "/settings/theme", label: "Theme", Icon: Palette },
    { href: "/whats-new", label: "What's new", detail: APP_VERSION, Icon: Sparkles },
    ...(isAdmin(user) ? [{ href: "/admin", label: "Dashboard", Icon: ChartColumn }] : []),
  ];

  return (
    <Screen back={{ href: "/me", label: "You" }} title="Settings">
      {user.guest && <GuestSave next="/settings" className="mb-6" />}
      <section aria-labelledby="appearance">
        <h2 id="appearance" className="mb-2 text-sm font-medium text-muted-foreground">
          Appearance
        </h2>
        <ThemeToggle />
      </section>

      <nav aria-label="More settings" className="mt-6 divide-y rounded-2xl border bg-card">
        {links.map(({ href, label, detail, Icon }) => (
          <Link
            key={href}
            href={href}
            transitionTypes={["nav-forward"]}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/50"
          >
            <Icon className="size-5 text-muted-foreground" aria-hidden />
            <span className="flex-1 font-medium">{label}</span>
            {detail && <span className="text-sm text-muted-foreground tabular-nums">{detail}</span>}
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        ))}
      </nav>

      <NotificationSettings prefs={prefs ?? null} email={{ ready: emailReady(), address: user.guest ? null : user.email }} />

      <TipsSettings />

      <section className="mt-6 divide-y rounded-2xl border bg-card">
        <Row label="Signed in as" value={user.guest ? "Guest" : (user.email ?? "—")} />
        <Row label="Time zone" value={tz} />
        <Row
          label="Bible text"
          value={copies.length ? copies.map((c) => `${c.translation} (${c.count.toLocaleString()} verses)`).join(" · ") : "Not loaded"}
        />
      </section>

      <SignOutForm action={signOut} guest={Boolean(user.guest)} />

      {/* Support Kept isn't listed: the logo opens it, for whoever goes looking. */}
      <footer className="mt-10 flex justify-center">
        <Link
          href="/settings/support"
          transitionTypes={["nav-forward"]}
          aria-label={`Kept ${APP_VERSION}`}
          className="group flex flex-col items-center gap-1.5 rounded-xl px-4 py-2 text-xs text-muted-foreground tabular-nums"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={22}
            height={22}
            unoptimized
            className="size-[22px] opacity-50 transition-transform duration-300 group-hover:rotate-45 group-active:rotate-45 dark:brightness-0 dark:invert"
          />
          Kept {APP_VERSION}
        </Link>
      </footer>
    </Screen>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words font-medium">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
