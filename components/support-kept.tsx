"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

// Shares Kept through the phone's share sheet, or copies the link where there isn't one.
export function ShareKept() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
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
