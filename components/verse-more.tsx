"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Archive, ArchiveRestore, Ellipsis, Pencil } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

// The verse page's top-bar "⋯": the things you only look for now and then (editing, archiving,
// when it was added and how it's going), kept out of the page until asked for.
export function VerseMore({
  reference,
  editHref,
  archived,
  details,
  archiveAction,
}: {
  reference: string;
  editHref: string | null; // null for an archived verse
  archived: boolean;
  details: string; // "Added Sep 29, 2026 · Learning"
  archiveAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const row = "flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium hover:bg-muted";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More"
        aria-haspopup="dialog"
        className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Ellipsis className="size-5" aria-hidden />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="verse-more-title">
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="animate-fade-in absolute inset-0 bg-black/40" />
            <div className="animate-rise relative mx-auto w-full max-w-md rounded-t-3xl border bg-background px-3 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)] sm:rounded-3xl">
              <div className="px-3 pb-3">
                <h2 id="verse-more-title" className="truncate font-brand text-xl font-semibold tracking-tight">
                  {reference}
                </h2>
                <p className="text-sm text-muted-foreground">{details}</p>
              </div>
              {editHref && (
                <Link href={editHref} transitionTypes={["nav-forward"]} onClick={() => setOpen(false)} className={row}>
                  <Pencil className="size-5 text-muted-foreground" aria-hidden /> Edit verse
                </Link>
              )}
              <form
                action={async () => {
                  await archiveAction();
                  setOpen(false);
                }}
              >
                <SubmitButton variant="ghost" className={`${row} justify-start`}>
                  {archived ? (
                    <>
                      <ArchiveRestore className="size-5 text-muted-foreground" aria-hidden /> Restore
                    </>
                  ) : (
                    <>
                      <Archive className="size-5 text-muted-foreground" aria-hidden /> Archive
                    </>
                  )}
                </SubmitButton>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
