"use server";

import { redirect } from "next/navigation";
import { siteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };
export type SignUpState = { error?: string; email?: string; sent?: boolean };

const MIN_PASSWORD = 12;

// Only allow redirects back into this app, never to another site.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Open the link we emailed you first, then sign in.", email };
    return { error: "That email and password don't match.", email };
  }

  redirect(safeNext(formData.get("next")));
}

// Creates an account. If the project asks new users to confirm their email, a link is sent and the
// form says so; otherwise the new user is signed in straight away.
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) return { error: "Enter your email and a password.", email };
  if (password.length < MIN_PASSWORD) return { error: `Use a password of at least ${MIN_PASSWORD} characters.`, email };

  const origin = await siteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    if (error.code === "signup_disabled") return { error: "New accounts aren't open yet.", email };
    if (error.code === "user_already_exists") return { error: "That email already has an account. Sign in instead.", email };
    if (error.code === "weak_password") return { error: "Choose a stronger password.", email };
    if (error.code === "over_email_send_rate_limit") return { error: "Too many sign-ups just now. Try again in a minute.", email };
    return { error: error.message || "The account couldn't be made. Try again.", email };
  }
  if (data.session) redirect(next);
  return { sent: true, email };
}

// Continue with Google: off to Google's sign-in, which returns through /auth/confirm (the same
// place sign-up emails land) and on to `next`. A new Google user gets an account on the way.
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const origin = await siteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?link=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
