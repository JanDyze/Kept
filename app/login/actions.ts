"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NEXT_COOKIE } from "@/lib/next-path";
import { siteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

// Kept signs in with Google only (email and password sign-in and sign-up were removed in 0.14.0).

// Only allow redirects back into this app, never to another site.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Remembers `next` for /auth/confirm, in case Google comes back without it.
async function rememberNext(next: string) {
  if (next !== "/") (await cookies()).set(NEXT_COOKIE, next, { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax", httpOnly: true });
}

// Continue with Google: off to Google's sign-in, which returns through /auth/confirm and on to
// `next`. A new Google user gets an account on the way.
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const origin = await siteOrigin();
  await rememberNext(next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?link=google");
  redirect(data.url);
}

// Continue as guest: an anonymous Supabase account, so every page works as usual with a few
// things held back (see GUEST_NOT_ALLOWED in lib/auth.ts). Needs anonymous sign-ins turned on in
// Supabase (Authentication → Sign In / Providers).
export async function continueAsGuest(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    // e.g. 422 anonymous_provider_disabled: the Supabase toggle is off.
    console.error("Continue as guest failed:", error.status, error.code, error.message);
    redirect("/login?link=guest");
  }
  redirect(next);
}

// A guest keeping their account: Google is linked to the same user, so their verses, cards and
// games stay. Needs manual linking turned on in Supabase. Comes back through /auth/confirm.
export async function saveWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const origin = await siteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`${next}${next.includes("?") ? "&" : "?"}saved=failed`);
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
