"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { saveWithGoogle } from "@/app/login/actions";
import { cn } from "@/lib/utils";

// Google's "G", as on the sign-in page.
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4.5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function SaveButton({ compact }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 border border-input bg-card font-medium transition-colors hover:bg-muted disabled:opacity-70",
        compact ? "h-9 shrink-0 rounded-full px-3.5 text-sm" : "h-11 w-full rounded-xl text-base",
      )}
    >
      {pending ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : <GoogleMark />}
      Save with Google
    </button>
  );
}

// For guests: what this needs (or why saving matters) and Save with Google, which links Google to
// this same account so everything they've done stays. `next` is where to come back to.
export function GuestSave({
  title = "You're a guest",
  detail = "Your verses and games are kept on this device only. Save with Google to keep them for good, add friends and share cards.",
  next = "/",
  compact,
  className,
}: {
  title?: string;
  detail?: string;
  next?: string;
  compact?: boolean; // one row, for Home
  className?: string;
}) {
  if (compact) {
    return (
      <form action={saveWithGoogle} className={cn("flex items-center gap-3 rounded-2xl border bg-card py-2.5 pr-2.5 pl-4", className)}>
        <input type="hidden" name="next" value={next} />
        <p className="min-w-0 flex-1 text-sm leading-snug">
          <span className="font-medium">{title}.</span> <span className="text-muted-foreground">Save to keep your verses.</span>
        </p>
        <SaveButton compact />
      </form>
    );
  }
  return (
    <section className={cn("rounded-2xl border bg-card p-4", className)}>
      <h2 className="font-brand text-lg font-semibold leading-tight tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <form action={saveWithGoogle} className="mt-3.5">
        <input type="hidden" name="next" value={next} />
        <SaveButton />
      </form>
    </section>
  );
}
