// When someone's morning reminder is due (lib/notify.ts). The cron runs every hour (and once a
// day from Vercel as a fallback); each run sends to people whose local clock has reached their
// hour today and who haven't had today's yet. A few hours' grace covers a missed run; after
// that the day is skipped rather than reminding them in the evening.

export const DEFAULT_DAILY_HOUR = 7;
const GRACE_HOURS = 4;

export function localParts(timeZone: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

export function reminderDue(opts: { timeZone: string; hour: number; lastOn: string | null }, at = new Date()) {
  const { date, hour } = localParts(opts.timeZone, at);
  const due = opts.lastOn !== date && hour >= opts.hour && hour < opts.hour + GRACE_HOURS;
  return { due, date };
}

// "7 am", "12 pm", for Settings.
export function hourLabel(h: number) {
  const suffix = h < 12 ? "am" : "pm";
  const n = h % 12 === 0 ? 12 : h % 12;
  return `${n} ${suffix}`;
}
