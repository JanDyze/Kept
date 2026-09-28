"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { keepSharedCard } from "@/app/cards/actions";
import { cn } from "@/lib/utils";

// Keep someone's card: the verse joins yours in their style; then it links to your copy.
export function KeepCardButton({ verseId }: { verseId: string }) {
  const [kept, setKept] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (kept)
    return (
      <Link
        href={`/verses/${kept}`}
        transitionTypes={["nav-forward"]}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-base font-medium hover:bg-muted"
      >
        <Check className="size-5" aria-hidden /> Kept · open yours
      </Link>
    );

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await keepSharedCard(verseId);
            if ("error" in result) setError(result.error);
            else setKept(result.id);
          })
        }
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/85 disabled:opacity-70",
        )}
      >
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <BookmarkPlus className="size-5" aria-hidden />} Keep this card
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
