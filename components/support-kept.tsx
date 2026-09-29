"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, HandHeart, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TAPS = 7;
const KEY = "kept-support-found";

// A quiet secret at the foot of Settings: tap the version seven times and a Support Kept card
// opens (giving, if a link is set in SUPPORT_URL, and sharing Kept). Once found, it stays found on
// this device.
export function SupportKept({ version, supportUrl }: { version: string; supportUrl: string | null }) {
  const [found, setFound] = useState(false);
  const [taps, setTaps] = useState(0);
  const [copied, setCopied] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this device's choice after mount
      if (localStorage.getItem(KEY) === "1") setFound(true);
    } catch {}
  }, []);

  function tap() {
    const now = Date.now();
    const n = now - last.current < 1500 ? taps + 1 : 1;
    last.current = now;
    setTaps(n);
    if (n >= TAPS) {
      setFound(true);
      setTaps(0);
      navigator.vibrate?.(30);
      try {
        localStorage.setItem(KEY, "1");
      } catch {}
    }
  }

  function hide() {
    setFound(false);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }

  return (
    <footer className="mt-10 flex flex-col items-center">
      {found && (
        <section aria-labelledby="support" className="animate-rise mb-6 w-full rounded-2xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-icon-tile">
              <HandHeart className="size-5 text-icon-ink" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="support" className="font-brand text-lg font-semibold tracking-tight">
                Support Kept
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Kept is free, with no ads. If it helps you hide God&apos;s Word in your heart, you can help keep it going.
              </p>
            </div>
            <button
              type="button"
              onClick={hide}
              aria-label="Hide"
              className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {supportUrl && (
              <a
                href={supportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/85"
              >
                <HandHeart className="size-4" aria-hidden /> Give
              </a>
            )}
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
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-base font-medium hover:bg-muted"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
              {copied ? "Link copied" : "Share Kept"}
            </button>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={tap}
        aria-label={`Kept ${version}`}
        className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2 text-xs text-muted-foreground tabular-nums"
      >
        <Image
          src="/logo.svg"
          alt=""
          width={22}
          height={22}
          unoptimized
          className={cn("size-[22px] opacity-50 transition-transform duration-200 dark:brightness-0 dark:invert", taps > 0 && "opacity-80")}
          style={{ transform: taps ? `rotate(${taps * 51}deg) scale(${1 + taps * 0.03})` : undefined }}
        />
        Kept {version}
      </button>
    </footer>
  );
}
