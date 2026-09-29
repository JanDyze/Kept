import { db } from "@/lib/db";
import { tips } from "@/lib/db/schema";
import { parseKofi } from "@/lib/tips/ko-fi";

// Ko-fi's webhook (ko-fi.com → Settings → API → Webhook URL: <site>/api/ko-fi). Records each tip
// for the admin dashboard. Ko-fi retries until it gets a 200, and a retry adds no second row.
export async function POST(request: Request) {
  const token = process.env.KOFI_VERIFICATION_TOKEN?.trim();
  if (!token) return new Response("Ko-fi isn't set up", { status: 503 });

  let data: string | null = null;
  try {
    const value = (await request.formData()).get("data");
    data = typeof value === "string" ? value : null;
  } catch {}

  const parsed = parseKofi(data, token);
  if (!parsed.ok) return new Response(null, { status: parsed.reason === "bad-token" ? 401 : 400 });

  await db
    .insert(tips)
    .values({ source: "kofi", ...parsed.tip })
    .onConflictDoNothing({ target: [tips.source, tips.externalId] });
  return new Response(null, { status: 200 });
}
