import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { announceUpdate, sendDailyReminders } from "@/lib/notify";

// The reminder run: daily reminders for everyone whose own hour it is (lib/daily-time.ts), a new
// version's announcement (once), and a query that keeps the free Supabase project awake. Safe to
// call as often as you like. GitHub Actions calls it every hour (.github/workflows/reminders.yml)
// so people's chosen times work; Vercel's free cron calls it once a day (vercel.json, 23:00 UTC =
// 7:00 in the Philippines) as a fallback for the default time.
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
