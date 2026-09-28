import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, LogOut, Users } from "lucide-react";
import { ProfileForm } from "@/components/friends";
import { Screen } from "@/components/screen";
import { SubmitButton } from "@/components/submit-button";
import { ThemePicker } from "@/components/theme-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth";
import { getTimeZone } from "@/lib/day";
import { db } from "@/lib/db";
import { bibleVerses } from "@/lib/db/schema";
import { pendingRequestCount } from "@/lib/social/friends";
import { getOrCreateProfile } from "@/lib/social/profiles";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [tz, copies, profile, requests] = await Promise.all([
    getTimeZone(),
    db
      .select({ translation: bibleVerses.translation, count: sql<number>`count(*)::int` })
      .from(bibleVerses)
      .groupBy(bibleVerses.translation),
    getOrCreateProfile(user),
    pendingRequestCount(user.id),
  ]);

  return (
    <Screen back={{ href: "/", label: "Home" }} title="Settings">
      <section aria-labelledby="profile">
        <h2 id="profile" className="mb-2 text-sm font-medium text-muted-foreground">
          Profile
        </h2>
        <ProfileForm username={profile.username} displayName={profile.displayName} />
        <Link
          href="/friends"
          transitionTypes={["nav-forward"]}
          className="mt-3 flex h-12 items-center gap-3 rounded-2xl border bg-card px-4 font-medium hover:bg-muted/40"
        >
          <Users className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">Friends</span>
          {requests > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">{requests}</span>
          )}
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      </section>

      <section aria-labelledby="appearance" className="mt-6">
        <h2 id="appearance" className="mb-2 text-sm font-medium text-muted-foreground">
          Appearance
        </h2>
        <ThemeToggle />
      </section>

      <section aria-labelledby="theme" className="mt-6">
        <h2 id="theme" className="mb-2 text-sm font-medium text-muted-foreground">
          Theme
        </h2>
        <ThemePicker />
      </section>

      <section className="mt-6 divide-y rounded-2xl border bg-card">
        <Row label="Signed in as" value={user.email ?? "—"} />
        <Row label="Time zone" value={tz} />
        <Row
          label="Bible text"
          value={copies.length ? copies.map((c) => `${c.translation} (${c.count.toLocaleString()} verses)`).join(" · ") : "Not loaded"}
        />
      </section>

      <form action={signOut} className="mt-6">
        <SubmitButton variant="outline" className="h-11 w-full gap-2 text-base">
          <LogOut className="size-4" aria-hidden /> Sign out
        </SubmitButton>
      </form>
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
