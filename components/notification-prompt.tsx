"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Sheet } from "@/components/sheet";
import { deviceState, turnOnPush } from "@/lib/push-client";
import { seenTours } from "@/lib/tours";

// The first time someone opens Kept on a device that can take notifications, a sheet offers them
// (the browser's own permission prompt only comes on the tap). "Not now" asks again in two weeks;
// Settings → Notifications is always there.
const KEY = "kept:push-asked";
const AGAIN_AFTER = 14 * 24 * 60 * 60 * 1000;

function askedRecently() {
  try {
    const at = Number(localStorage.getItem(KEY));
    return at > 0 && Date.now() - at < AGAIN_AFTER;
  } catch {
    return true; // no storage: don't nag every visit
  }
}
function markAsked() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

export function NotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (askedRecently()) return;
    let timer = 0;
    let cancelled = false;
    void deviceState().then((state) => {
      if (state !== "off" || cancelled) return;
      // After Home's tour (or once it's been seen), and never over another sheet.
      const tryOpen = () => {
        if (cancelled) return;
        if (!seenTours().has("home") || document.querySelector("[data-tour-open], [role='dialog']")) {
          timer = window.setTimeout(tryOpen, 1500);
          return;
        }
        setOpen(true);
      };
      timer = window.setTimeout(tryOpen, 2500);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const later = () => {
    markAsked();
    setOpen(false);
  };

  async function turnOn() {
    setBusy(true);
    setError(null);
    const result = await turnOnPush();
    setBusy(false);
    markAsked();
    if (result.state === "on" || result.state === "blocked") setOpen(false);
    else if (result.error) setError(result.error);
    else setOpen(false);
  }

  return (
    <Sheet open={open} onClose={later} title="A gentle reminder each morning?">
      <div className="px-2">
        <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icon-tile">
            <BellRing className="size-5 text-icon-ink" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            At 7 each morning: today&apos;s verse and how many are ready to practise. You&apos;ll also hear when a friend reacts to your card.
            Change the time, or turn it off, in Settings.
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={later}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border text-base font-medium hover:bg-muted"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void turnOn()}
            disabled={busy}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Turn on
          </button>
        </div>
      </div>
    </Sheet>
  );
}
