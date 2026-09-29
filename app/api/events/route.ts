import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appEvents } from "@/lib/db/schema";

// Page views for the admin dashboard, sent by ActivityPing. Ids, tokens and names are folded out
// of the path, so it records which screen was opened, not which verse or person.
function foldPath(raw: string) {
  const path = raw.split(/[?#]/)[0].slice(0, 200) || "/";
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/:id")
    .replace(/^\/s\/[^/]+/, "/s/:token")
    .replace(/^\/u\/[^/]+/, "/u/:name")
    .replace(/^\/bible\/(?!search(?:\/|$))[^/]+(\/\d+)?/, (_m, ch) => `/bible/:book${ch ? "/:chapter" : ""}`);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return new Response(null, { status: 204 });
  let path = "/";
  try {
    const body = (await request.json()) as { path?: unknown };
    if (typeof body.path === "string" && body.path.startsWith("/")) path = body.path;
  } catch {
    return new Response(null, { status: 400 });
  }
  const folded = foldPath(path);
  if (folded.startsWith("/admin")) return new Response(null, { status: 204 });
  await db.insert(appEvents).values({ userId: user.id, kind: "view", path: folded });
  return new Response(null, { status: 204 });
}
