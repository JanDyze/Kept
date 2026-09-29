// Where to go after signing in (a shared profile link, say), kept in a cookie as well as the
// `next` parameter: links that leave the app (sign-up emails, Google) may come back without it.
export const NEXT_COOKIE = "kept-next";

// Only paths back into this app, never another site.
export function safeNextPath(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;
}
