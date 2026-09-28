import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where the link in a sign-up email lands: it signs the new user in, then carries on to `next`.
// Handles both link styles Supabase sends (a PKCE `code`, or a `token_hash` with its type).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const nextParam = url.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  // Google (or another provider) came back without signing in, e.g. the user tapped Cancel.
  if (url.searchParams.has("error")) return NextResponse.redirect(new URL("/login?link=cancelled", url.origin));

  const supabase = await createClient();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing token") };

  return NextResponse.redirect(new URL(error ? "/login?link=expired" : next, url.origin));
}
