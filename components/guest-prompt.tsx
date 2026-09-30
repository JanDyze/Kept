"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GUEST_NOT_ALLOWED } from "@/lib/guest";
import { GuestSave } from "./guest-save";

const EVENT = "kept:guest-save";

// Call with an action's error: when it's the guest answer, the Save your account sheet opens and
// this returns true (so the caller can skip showing the error itself).
export function askGuestToSave(error: string | undefined | null) {
  if (error !== GUEST_NOT_ALLOWED) return false;
  window.dispatchEvent(new Event(EVENT));
  return true;
}

// Mounted once in the root layout: the sheet a guest sees when they try something that needs an
// account (a like, keeping a card, sharing).
export function GuestPromptHost() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center" role="dialog" aria-modal="true" aria-label="Save your account">
      <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div className="animate-rise relative mx-auto w-full max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <GuestSave
          title="That needs an account"
          detail="Likes, friends and sharing are for saved accounts. Save your account and everything you've done as a guest comes with you."
          next={pathname}
          className="shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)]"
        />
      </div>
    </div>
  );
}
