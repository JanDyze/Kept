"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { signIn, signInWithGoogle, signUp, type SignInState, type SignUpState } from "./actions";

// Google's own "G" mark, as its sign-in guidelines ask for on a neutral button.
function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-input bg-card text-base font-medium transition-colors hover:bg-muted disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
      )}
      Continue with Google
    </button>
  );
}

// Sign in, or (mode "signup") create an account. The other is a link away, keeping `next`.
export function LoginForm({ next, mode }: { next?: string; mode: "signin" | "signup" }) {
  const signingUp = mode === "signup";
  const [state, action, pending] = useActionState<SignInState & SignUpState, FormData>(signingUp ? signUp : signIn, {});
  const other = new URLSearchParams({ ...(signingUp ? {} : { mode: "signup" }), ...(next ? { next } : {}) });

  if (state.sent)
    return (
      <div className="animate-rise flex flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-7 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-icon-tile">
          <MailCheck className="size-6 text-icon-ink" aria-hidden />
        </span>
        <h2 className="font-brand text-xl font-semibold tracking-tight">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a link to <span className="font-medium text-foreground">{state.email}</span>. Open it to finish making your
          account.
        </p>
      </div>
    );

  return (
    <>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next ?? ""} />
        <GoogleButton />
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.email}
            className="h-11 text-base"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={signingUp ? "new-password" : "current-password"}
            minLength={signingUp ? 12 : undefined}
            required
            className="h-11 text-base"
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-11 text-base">
          {signingUp ? (pending ? "Making your account…" : "Create account") : pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {signingUp ? "Have an account? " : "New to Kept? "}
        <Link href={`/login${other.size ? `?${other}` : ""}`} replace className="font-medium text-primary underline-offset-4 hover:underline">
          {signingUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </>
  );
}
