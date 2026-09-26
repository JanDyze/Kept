import "server-only";
import { cookies } from "next/headers";

// The browser stores its time zone in this cookie (components/timezone-sync.tsx), so "today"
// follows the phone's clock rather than the server's.
export const TZ_COOKIE = "kept-tz";
const FALLBACK_TZ = "Asia/Manila";

function isTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function getTimeZone() {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  return tz && isTimeZone(tz) ? tz : FALLBACK_TZ;
}

// YYYY-MM-DD in the given time zone.
export function localDate(tz: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export async function today() {
  return localDate(await getTimeZone());
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
