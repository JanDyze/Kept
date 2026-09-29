"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { dismissWhatsNew } from "@/app/whats-new/actions";

// After an update, once: a sheet with what changed since the last version they saw. Closing it,
// or opening all the notes, marks this version seen.
export function WhatsNewSheet({ version, title, children }: { version: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    void dismissWhatsNew();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
      <button type="button" aria-label="Close" onClick={close} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div className="animate-rise relative mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl border bg-background shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)] sm:rounded-3xl">
        <div className="flex items-center gap-3 px-5 pt-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-icon-tile">
            <Sparkles className="size-5 text-icon-ink" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">What&apos;s new in {version}</p>
            <h2 id="whats-new-title" className="truncate font-brand text-xl font-semibold tracking-tight">
              {title}
            </h2>
          </div>
        </div>
        <div className="mt-4 overflow-y-auto overscroll-contain px-5">{children}</div>
        <div className="flex gap-2 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Link
            href="/whats-new"
            transitionTypes={["nav-forward"]}
            onClick={close}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border text-base font-medium hover:bg-muted"
          >
            All updates
          </Link>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/85"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
