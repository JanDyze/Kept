"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationPrefs, pushSubscriptions } from "@/lib/db/schema";
import { emailReady, gmailSetup, sendEmails } from "@/lib/email";
import { pushReady, sendPush } from "@/lib/push";

const subscription = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

// This device takes notifications: saved for this person, with their settings made on first use.
export async function savePushSubscription(value: unknown, timeZone: string | null): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = subscription.safeParse(value);
  if (!parsed.success) return { error: "This device couldn't be set up for notifications." };
  const { endpoint, keys } = parsed.data;
  await db
    .insert(pushSubscriptions)
    .values({ endpoint, userId: user.id, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth } });
  const tz = timeZone && timeZone.length < 64 ? timeZone : null;
  await db
    .insert(notificationPrefs)
    .values({ userId: user.id, timeZone: tz })
    .onConflictDoUpdate({ target: notificationPrefs.userId, set: { timeZone: tz, updatedAt: new Date() } });
  revalidatePath("/settings");
  return {};
}

// This device stops taking them.
export async function removePushSubscription(endpoint: string) {
  const user = await requireUser();
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
  revalidatePath("/settings");
}

const kinds = z.enum(["daily", "friends", "updates", "email"]);

// One kind on or off, for all of this person's devices.
export async function setNotificationPref(kind: string, on: boolean): Promise<{ error?: string }> {
  const user = await requireUser();
  const k = kinds.safeParse(kind);
  if (!k.success) return { error: "That can't be changed." };
  await db
    .insert(notificationPrefs)
    .values({ userId: user.id, [k.data]: on })
    .onConflictDoUpdate({ target: notificationPrefs.userId, set: { [k.data]: on, updatedAt: new Date() } });
  revalidatePath("/settings");
  return {};
}

// What time the daily reminder comes (0–23, in this device's time zone).
export async function setDailyHour(hour: number, timeZone: string | null): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return { error: "That time can't be saved." };
  const tz = timeZone && timeZone.length < 64 ? timeZone : null;
  await db
    .insert(notificationPrefs)
    .values({ userId: user.id, dailyHour: hour, timeZone: tz })
    .onConflictDoUpdate({
      target: notificationPrefs.userId,
      set: { dailyHour: hour, ...(tz ? { timeZone: tz } : {}), updatedAt: new Date() },
    });
  revalidatePath("/settings");
  return {};
}

// A test, to see that it works: to this person's devices and their email, whatever the switches,
// saying plainly what was sent and what's missing or went wrong.
export async function sendTestPush(): Promise<{ sent: number; lines: string[] }> {
  const user = await requireUser();
  const message = {
    title: "Notifications are on",
    body: "This is how Kept will remind you each morning, with today's verse.",
    url: "/settings",
    tag: "test",
  };
  const lines: string[] = [];
  let sent = 0;

  // Phone notifications.
  if (!pushReady()) lines.push("Phone notifications aren't set up on the server (the VAPID keys are missing).");
  else {
    const devices = await db.select({ e: pushSubscriptions.endpoint }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));
    if (devices.length === 0) lines.push("No phone or browser of yours has notifications turned on.");
    else {
      const problems: string[] = [];
      const n = await sendPushTo(user.id, message, problems);
      sent += n;
      lines.push(n ? `Sent to ${n} ${n === 1 ? "device" : "devices"}.` : "No device took it.", ...problems);
    }
  }

  // Email.
  if (!emailReady()) lines.push("Email isn't set up on the server (GMAIL_USER and GMAIL_APP_PASSWORD, or RESEND_API_KEY, are missing).");
  else if (!user.email) lines.push("Your account has no email address.");
  else {
    const problems: string[] = [];
    const n = await sendEmails([user.email], message, problems);
    sent += n;
    const g = gmailSetup();
    if (!n && g)
      problems.push(
        `Kept signs in to Gmail as "${g.user}" with a ${g.length}-character password.` +
          (g.length !== 16 ? " A Gmail app password has exactly 16 letters, so this looks like a normal password or a typo." : " That's the right length, so check the address, and that the app password was made on that same account."),
      );
    lines.push(n ? `Emailed ${user.email}${process.env.GMAIL_USER ? " (through Gmail)" : " (through Resend)"}.` : `The email to ${user.email} wasn't sent.`, ...problems);
  }
  return { sent, lines };
}

// Every device of one person, whatever their switches (for the test).
async function sendPushTo(userId: string, message: { title: string; body: string; url: string; tag: string }, problems: string[]) {
  for (const kind of ["daily", "friends", "updates"] as const) {
    const n = await sendPush([userId], kind, message, problems);
    if (n) return n;
  }
  return 0;
}
