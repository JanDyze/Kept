import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { announceUpdate, sendDailyReminders } from "@/lib/notify";

// Daily Vercel cron (vercel.json, 00:00 UTC = 8:00 in the Philippines): the morning reminder, a
// new version's announcement (once), and a query that keeps the free Supabase project awake.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await db.execute(sql`select 1`);
  const [daily, updates] = await Promise.all([sendDailyReminders(), announceUpdate()]);
  return Response.json({ ok: true, daily, updates, at: new Date().toISOString() });
}
