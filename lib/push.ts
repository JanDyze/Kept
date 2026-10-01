import "server-only";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import webpush from "web-push";
import { emailReady, sendEmails } from "@/lib/email";
import { db } from "@/lib/db";
import { notificationPrefs, pushSubscriptions } from "@/lib/db/schema";

// Web Push: notifications to phones and browsers that turned them on (Settings → Notifications).
// Needs NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (`npx web-push generate-vapid-keys`),
// and VAPID_SUBJECT (a mailto: or the site's URL). Without them nothing is sent.

export type PushKind = "daily" | "friends" | "updates";
export type PushMessage = {
  title: string;
  body: string;
  url?: string; // opened when the notification is tapped
  tag?: string; // a newer one with the same tag replaces it
};

let configured: boolean | null = null;
export function pushReady() {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  configured = Boolean(pub && priv);
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || process.env.SITE_URL || "mailto:hello@kept.app", pub!, priv!);
  return configured;
}

// Sends a message to these people however they asked for it: push to their devices, and email
// to those with email on (lib/email.ts). Each only if they want this kind.
export async function deliver(userIds: string[], kind: PushKind, message: PushMessage) {
  const [pushed, emailed] = await Promise.all([sendPush(userIds, kind, message), emailPeople(userIds, kind, message)]);
  return pushed + emailed;
}

async function emailPeople(userIds: string[], kind: PushKind, message: PushMessage) {
  if (!emailReady() || userIds.length === 0) return 0;
  try {
    // Email is on by default: people with no settings row get it too.
    const rows = await db
      .select({ email: authUsers.email })
      .from(authUsers)
      .leftJoin(notificationPrefs, eq(notificationPrefs.userId, authUsers.id))
      .where(
        and(
          inArray(authUsers.id, userIds),
          isNotNull(authUsers.email),
          sql`coalesce(${notificationPrefs.email}, true)`,
          sql`coalesce(${notificationPrefs[kind]}, true)`,
        ),
      );
    return await sendEmails(rows.flatMap((r) => (r.email ? [r.email] : [])), message);
  } catch (e) {
    console.error("email lookup failed", e);
    return 0;
  }
}

// Sends to every device of these people who want this kind; drops subscriptions that are gone.
// Never throws: a failed notification mustn't fail what caused it.
// `problems` collects what went wrong, for Settings' test send.
export async function sendPush(userIds: string[], kind: PushKind, message: PushMessage, problems?: string[]) {
  if (!pushReady() || userIds.length === 0) return 0;
  try {
    const subs = await db
      .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
      .from(pushSubscriptions)
      .innerJoin(notificationPrefs, eq(notificationPrefs.userId, pushSubscriptions.userId))
      .where(and(inArray(pushSubscriptions.userId, userIds), eq(notificationPrefs[kind], true)));
    const payload = JSON.stringify({ icon: "/icons/icon-192.png", url: "/", ...message });
    let sent = 0;
    const gone: string[] = [];
    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 })
          .then(() => sent++)
          .catch((e: { statusCode?: number; body?: string; message?: string }) => {
            if (e.statusCode === 404 || e.statusCode === 410) gone.push(s.endpoint);
            problems?.push(`Phone notification refused (${e.statusCode ?? "no answer"}): ${(e.body || e.message || "").slice(0, 160)}`);
          }),
      ),
    );
    if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, gone));
    return sent;
  } catch (e) {
    console.error("push failed", e);
    return 0;
  }
}
