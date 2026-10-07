"use client";

import { ChevronDown } from "lucide-react";
import { Sheet } from "@/components/sheet";
import { cn } from "@/lib/utils";

// The Reference game's chapter or verse choice: a button showing the pick, opening a sheet with
// a grid of the numbers there are (a book's chapters, a chapter's verses), like choosing in the
// Bible. `open`/`onOpenChange` let the game open the next one by itself.
export function NumberPicker({
  label,
  title,
  count,
  value,
  onChange,
  disabled,
  open,
  onOpenChange,
}: {
  label: string; // "Ch." / "V."
  title: string; // "John · chapter"
  count: number | undefined; // undefined until there's something to choose from
  value: number | null;
  onChange: (n: number) => void;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const off = disabled || !count;
  return (
    <>
      <button
        type="button"
        disabled={off}
        onClick={() => onOpenChange(true)}
        aria-haspopup="dialog"
        aria-label={value ? `${title}: ${value}` : title}
        className={cn(
          "flex h-11 min-w-0 flex-1 items-center justify-between gap-1 rounded-xl border border-input bg-card px-3 text-base tabular-nums transition-colors hover:bg-muted/50 disabled:opacity-50",
          !value && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {label} {value ?? "–"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <Sheet open={open && !off} onClose={() => onOpenChange(false)} title={title}>
        <div className="grid grid-cols-6 gap-1.5 px-2 pb-1 sm:grid-cols-8">
          {Array.from({ length: count ?? 0 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={value === n}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border text-base font-medium tabular-nums transition-[transform,background-color] active:scale-90",
                value === n ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
