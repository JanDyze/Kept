import "server-only";
import { and, eq, exists, isNull, lte, sql } from "drizzle-orm";
import { APP_VERSION, compareVersions, getReleases } from "@/lib/changelog";
import { db } from "@/lib/db";
import { appState, notificationPrefs, pushSubscriptions, verses } from "@/lib/db/schema";
import { sendPush } from "@/lib/push";
import { isReaction, REACTIONS } from "@/lib/reactions";
import { getProfiles } from "@/lib/social/profiles";

// What Kept tells people, and when (lib/push.ts sends it). Each respects that kind's setting.

const name = (p: { displayName: string | null; username: string } | undefined) => (p ? (p.displayName ?? `@${p.username}`) : "Someone");

// Someone reacted to your card (only a new reaction, not a change of mind).
export async function notifyCardReaction(ownerId: string, actorId: string, card: { id: string; reference: string }, reaction: string) {
  const actor = (await getProfiles([actorId])).get(actorId);
  const r = isReaction(reaction) ? REACTIONS[reaction] : REACTIONS.heart;
  await sendPush([ownerId], "friends", {
    title: `${name(actor)} reacted ${r.label}`,
    body: `to your card, ${card.reference}`,
    url: `/cards/${card.id}`,
    tag: `card-${card.id}`,
  });
}

export async function notifyFriendRequest(toId: string, fromId: string) {
  const from = (await getProfiles([fromId])).get(fromId);
  await sendPush([toId], "friends", {
    title: `${name(from)} wants to be friends`,
    body: "Say yes to see each other's friends-only cards.",
    url: "/friends",
    tag: `friend-${fromId}`,
  });
}

export async function notifyFriendAccepted(toId: string, byId: string) {
  const by = (await getProfiles([byId])).get(byId);
  await sendPush([toId], "friends", {
    title: `You and ${name(by)} are friends`,
    body: "Their friends-only cards now show in Discover.",
    url: "/search?who=friends",
    tag: `friend-${byId}`,
  });
}

// The morning reminder (the daily cron): today's verse and how many are ready to practise.
export async function sendDailyReminders() {
  const people = await db
    .select({ userId: notificationPrefs.userId })
    .from(notificationPrefs)
    .where(
      and(
        eq(notificationPrefs.daily, true),
        exists(db.select({ one: sql`1` }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, notificationPrefs.userId))),
      ),
    );
  let sent = 0;
  for (const { userId } of people) {
    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        due: sql<number>`(count(*) filter (where ${lte(verses.dueAt, sql`now()`)}))::int`,
      })
      .from(verses)
      .where(and(eq(verses.userId, userId), isNull(verses.archivedAt)));
    const [first] = await db
      .select({ reference: verses.reference, id: verses.id })
      .from(verses)
      .where(and(eq(verses.userId, userId), isNull(verses.archivedAt)))
      .orderBy(verses.dueAt, sql`${verses.createdAt} desc`)
      .limit(1);
    const message = !counts?.total
      ? { title: "Good morning", body: "Keep one verse today, and Kept turns it into games to help you remember it.", url: "/verses/new" }
      : {
          title: `Good morning · ${first.reference}`,
          body:
            counts.due > 0
              ? `${counts.due} ${counts.due === 1 ? "verse is" : "verses are"} ready to practise, and today's games are waiting.`
              : "Today's games are ready. A few minutes keeps your streak going.",
          url: "/",
        };
    sent += await sendPush([userId], "daily", { ...message, tag: "daily" });
  }
  return sent;
}

// A new version since the last one announced: tell everyone who wants updates, once.
export async function announceUpdate() {
  const [row] = await db.select().from(appState).where(eq(appState.key, "announced_version"));
  if (row && compareVersions(APP_VERSION, row.value) <= 0) return 0;
  const release = (await getReleases())[0];
  const people = await db.select({ userId: notificationPrefs.userId }).from(notificationPrefs).where(eq(notificationPrefs.updates, true));
  const sent = release
    ? await sendPush(
        people.map((p) => p.userId),
        "updates",
        { title: `New in Kept ${release.version}`, body: release.title || "See what's new.", url: "/whats-new", tag: "update" },
      )
    : 0;
  await db
    .insert(appState)
    .values({ key: "announced_version", value: APP_VERSION })
    .onConflictDoUpdate({ target: appState.key, set: { value: APP_VERSION, updatedAt: new Date() } });
  return sent;
}
