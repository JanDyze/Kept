"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// A bottom sheet on a phone, a centred dialog wider up: the one modal look for Kept (sharing,
// confirmations). Closes on the backdrop, the ✕ and Escape.
export function Sheet({
  open,
  onClose,
  title,
  description,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Escape closes only the top sheet (a confirmation over Share closes, Share stays).
    const onKey = (e: KeyboardEvent) => {
      const sheets = document.querySelectorAll("[data-sheet]");
      if (e.key === "Escape" && sheets[sheets.length - 1] === root.current) onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page underneath stays put while the sheet is up.
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      ref={root}
      data-sheet
      className="fixed inset-0 z-[70] flex flex-col justify-end sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
    >
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div
        className={cn(
          "animate-rise relative mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl border bg-background shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)] sm:rounded-3xl",
          className,
        )}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className="font-brand text-xl font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={`${id}-desc`} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-4 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
