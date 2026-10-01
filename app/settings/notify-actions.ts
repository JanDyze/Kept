"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationPrefs, pushSubscriptions } from "@/lib/db/schema";
import { deliver } from "@/lib/push";

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

// A test, to see that it works: to this person's devices, and by email if that's on.
export async function sendTestPush(): Promise<{ sent: number }> {
  const user = await requireUser();
  for (const kind of ["daily", "friends", "updates"] as const) {
    const sent = await deliver([user.id], kind, {
      title: "Notifications are on",
      body: "This is how Kept will remind you each morning, with today's verse.",
      url: "/settings",
      tag: "test",
    });
    if (sent) return { sent };
  }
  return { sent: 0 };
}
