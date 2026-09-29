"use client";

import { useState } from "react";
import { Check, CircleFadingPlus, Loader2, Share2 } from "lucide-react";
import { keptStory, shareImage } from "@/lib/share/story";
import { cn } from "@/lib/utils";

// Counts a tap for the admin dashboard's Support numbers. Fire and forget, like ActivityPing.
function track(kind: "support_give" | "support_share") {
  const body = JSON.stringify({ path: location.pathname, kind });
  if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" })))
    void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}

// A way to give: an outside link (Give), or the GCash code saved to the phone (`download`).
export function GiveLink({
  href,
  download,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  download?: string;
  variant?: "primary" | "outline";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(download ? { download } : { target: "_blank", rel: "noreferrer" })}
      onClick={() => track("support_give")}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-base font-medium",
        variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/85" : "border hover:bg-muted",
        className,
      )}
    >
      {children}
    </a>
  );
}

// Shares Kept: its link through the phone's share sheet (or copied where there isn't one), or a
// story image for Instagram and Facebook Stories.
export function ShareKept() {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function story() {
    track("support_share");
    setBusy(true);
    try {
      await shareImage(await keptStory(), "Kept story.png");
    } catch {
    } finally {
      setBusy(false);
    }
  }

  const button = "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-base font-medium hover:bg-muted disabled:opacity-60";
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          track("support_share");
          if (typeof navigator.share === "function")
            void navigator.share({ title: "Kept", text: "Memorize Scripture with daily games.", url: location.origin }).catch(() => {});
          else
            void navigator.clipboard.writeText(location.origin).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
        }}
        className={button}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
        {copied ? "Link copied" : "Share Kept"}
      </button>
      <button type="button" disabled={busy} onClick={() => void story()} className={button}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CircleFadingPlus className="size-4" aria-hidden />}
        Stories
      </button>
    </div>
  );
}
