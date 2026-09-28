"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type SignInState, type SignUpState } from "./actions";

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
