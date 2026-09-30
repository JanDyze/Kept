"use client";

import { useRef } from "react";
import { LogOut } from "lucide-react";
import { ask } from "@/components/confirm";
import { SubmitButton } from "@/components/submit-button";

// Sign out, or for a guest leave guest mode, which loses everything they haven't saved: that asks first.
export function SignOutForm({ action, guest }: { action: () => Promise<void>; guest: boolean }) {
  const sure = useRef(false);
  return (
    <form
      action={action}
      onSubmit={async (e) => {
        if (!guest || sure.current) return;
        e.preventDefault();
        const form = e.currentTarget;
        const yes = await ask({
          title: "Leave guest mode?",
          body: "Your verses and games aren't saved to an account, so they'll be gone.",
          confirm: "Leave",
          cancel: "Stay",
          danger: true,
        });
        if (!yes) return;
        sure.current = true;
        form.requestSubmit();
      }}
      className="mt-6"
    >
      <SubmitButton variant="outline" className="h-11 w-full gap-2 text-base">
        <LogOut className="size-4" aria-hidden /> {guest ? "Leave guest mode" : "Sign out"}
      </SubmitButton>
      {guest && <p className="mt-2 text-center text-xs text-muted-foreground">Leaving without saving loses your verses and games.</p>}
    </form>
  );
}
