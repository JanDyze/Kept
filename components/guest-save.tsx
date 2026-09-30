"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { saveAccount } from "@/app/login/actions";
import { AppleMark, GoogleMark, useAppleSignIn } from "@/components/sign-in-marks";
import { cn } from "@/lib/utils";

function SaveButton({ provider, compact }: { provider: "google" | "apple"; compact?: boolean }) {
  const { pending } = useFormStatus();
  const apple = provider === "apple";
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 font-medium transition-colors disabled:opacity-70",
        apple ? "bg-foreground text-background hover:bg-foreground/90" : "border border-input bg-card hover:bg-muted",
        compact ? "h-9 shrink-0 rounded-full px-3.5 text-sm" : "h-11 w-full rounded-xl text-base",
      )}
    >
      {pending ? (
        <Loader2 className="size-4.5 animate-spin" aria-hidden />
      ) : apple ? (
        <AppleMark className="size-4.5" />
      ) : (
        <GoogleMark className="size-4.5" />
      )}
      {apple ? "Save with Apple" : "Save with Google"}
    </button>
  );
}

// Save with Google (and Apple, once it's on): links it to this same account, so everything the
// guest has done stays. One form per provider.
function SaveForms({ next, compact }: { next: string; compact?: boolean }) {
  const apple = useAppleSignIn();
  return (["google", ...(apple ? ["apple" as const] : [])] as const).map((provider) => (
    <form key={provider} action={saveAccount} className={compact ? undefined : "w-full"}>
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="next" value={next} />
      <SaveButton provider={provider} compact={compact} />
    </form>
  ));
}

// For guests: what this needs (or why saving matters) and the Save buttons. `next` is where to
// come back to.
export function GuestSave({
  title = "You're a guest",
  detail = "Your verses and games are kept on this device only. Save your account to keep them for good, add friends and share cards.",
  next = "/",
  compact,
  className,
}: {
  title?: string;
  detail?: string;
  next?: string;
  compact?: boolean; // one row, for Home (buttons wrap under the words when there are two)
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center justify-end gap-x-3 gap-y-2 rounded-2xl border bg-card py-2.5 pr-2.5 pl-4", className)}>
        <p className="min-w-40 flex-1 text-sm leading-snug">
          <span className="font-medium">{title}.</span> <span className="text-muted-foreground">Save to keep your verses.</span>
        </p>
        <div className="flex gap-2">
          <SaveForms next={next} compact />
        </div>
      </div>
    );
  }
  return (
    <section className={cn("rounded-2xl border bg-card p-4", className)}>
      <h2 className="font-brand text-lg font-semibold leading-tight tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <div className="mt-3.5 flex flex-col gap-2">
        <SaveForms next={next} />
      </div>
    </section>
  );
}
