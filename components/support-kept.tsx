"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
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

// Shares Kept through the phone's share sheet, or copies the link where there isn't one.
export function ShareKept() {
  const [copied, setCopied] = useState(false);

  return (
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
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-base font-medium hover:bg-muted"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {copied ? "Link copied" : "Share Kept"}
    </button>
  );
}
