import { cn } from "@/lib/utils";

// The verse page's row of actions (card, share, note, practice): an icon over a short label, four
// abreast so the row never wraps. Panels they open (share, practice) sit under the whole row.
export const verseAction = (active?: boolean) =>
  cn(
    "relative flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

// For what a row action opens: under the row, full width.
export const verseActionPanel = "order-last col-span-full";
