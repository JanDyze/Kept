import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null; name: string | null };

// Verifies the session JWT. Cached per request so several callers share one check. `name` is the
// name a provider like Google gave (used to suggest a first username).
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const name = [meta.full_name, meta.name].find((n): n is string => typeof n === "string" && n.trim() !== "");
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null, name: name?.trim() ?? null };
});

// Use in every page and server action that touches user data; filter queries by user.id.
export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
