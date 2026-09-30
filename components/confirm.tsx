"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/sheet";
import { cn } from "@/lib/utils";

// Kept's own "Are you sure?", in place of the browser's confirm(): `if (!(await ask({ … }))) return;`.
// One ConfirmHost (app/layout.tsx) shows them; asking again while one is open answers the first no.
export type Ask = {
  title: string;
  body?: string;
  confirm: string; // the button, named for what it does: "Delete", "Give up"
  cancel?: string;
  danger?: boolean; // destroys something: a red button
};

const ASK_EVENT = "kept-ask";
type Pending = Ask & { answer: (yes: boolean) => void };

export function ask(question: Ask): Promise<boolean> {
  return new Promise((answer) => window.dispatchEvent(new CustomEvent<Pending>(ASK_EVENT, { detail: { ...question, answer } })));
}

export function ConfirmHost() {
  const [q, setQ] = useState<Pending | null>(null);

  useEffect(() => {
    const onAsk = (e: Event) => {
      const next = (e as CustomEvent<Pending>).detail;
      setQ((was) => {
        was?.answer(false);
        return next;
      });
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  const reply = (yes: boolean) => {
    q?.answer(yes);
    setQ(null);
  };

  return (
    <Sheet open={q !== null} onClose={() => reply(false)} title={q?.title ?? ""} description={q?.body}>
      <div className="flex gap-2 px-2 pt-2">
        <button
          type="button"
          onClick={() => reply(false)}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border text-base font-medium hover:bg-muted"
        >
          {q?.cancel ?? "Cancel"}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => reply(true)}
          className={cn(
            "inline-flex h-11 flex-1 items-center justify-center rounded-xl text-base font-semibold",
            q?.danger ? "bg-destructive text-white hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/85",
          )}
        >
          {q?.confirm}
        </button>
      </div>
    </Sheet>
  );
}
