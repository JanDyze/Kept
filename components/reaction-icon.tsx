import type { Reaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";

// Kept's own reaction marks, in place of emoji: flat shapes in their own color, with the
// ink-colored details and paper-colored gaps of the Home icons, so they match light and dark.
// Each is drawn on a 24×24 grid.
const ink = "fill-icon-ink";

const ICONS: Record<Reaction, React.ReactNode> = {
  // A heart, a soft shine on its left lobe.
  heart: (
    <>
      <path d="M12 21.2s-8.6-5.1-9.9-10.6C1.2 6.9 3.6 3.6 7 3.6c2.1 0 3.8 1.1 5 2.9 1.2-1.8 2.9-2.9 5-2.9 3.4 0 5.8 3.3 4.9 7-1.3 5.5-9.9 10.6-9.9 10.6Z" className="fill-rose-500 dark:fill-rose-400" />
      <path d="M6.2 7.2c-1 .3-1.6 1.2-1.6 2.3" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-white/70" />
    </>
  ),
  // Amen: two hands pressed together, palms up to a point, with cuffs at the wrists.
  amen: (
    <>
      <path d="M11.4 3.2c-.9.5-1.6 1.6-2 3l-2 6.3c-.3 1-.9 1.9-1.6 2.6L4.6 16.3 8 20.6l2.3-2c.7-.6 1.1-1.5 1.1-2.4Z" className="fill-amber-300 stroke-icon-paper" strokeWidth="1.2" strokeLinejoin="round" style={{ paintOrder: "stroke" }} />
      <path d="M12.6 3.2c.9.5 1.6 1.6 2 3l2 6.3c.3 1 .9 1.9 1.6 2.6l1.2 1.2-3.4 4.3-2.3-2c-.7-.6-1.1-1.5-1.1-2.4Z" className="fill-amber-400 stroke-icon-paper" strokeWidth="1.2" strokeLinejoin="round" style={{ paintOrder: "stroke" }} />
      <path d="M3.6 17.2 7.7 21.4 6.3 22.8 2.2 18.6Z M20.4 17.2 16.3 21.4 17.7 22.8 21.8 18.6Z" className={ink} />
    </>
  ),
  // Praise: a burst of glory, one big four-pointed star and a small one.
  praise: (
    <>
      <path d="M10 2.5c.5 4.4 2.6 6.5 7 7-4.4.5-6.5 2.6-7 7-.5-4.4-2.6-6.5-7-7 4.4-.5 6.5-2.6 7-7Z" className="fill-icon-accent" />
      <path d="M18.5 13.5c.3 2.4 1.4 3.5 3.8 3.8-2.4.3-3.5 1.4-3.8 3.8-.3-2.4-1.4-3.5-3.8-3.8 2.4-.3 3.5-1.4 3.8-3.8Z" className={ink} />
      <circle cx="19.5" cy="5" r="1.2" className={ink} />
    </>
  ),
  // Fire: a flame with a brighter heart.
  fire: (
    <>
      <path d="M12 22c-4.3 0-7.3-3-7.3-6.9 0-3.3 2-5.2 3.6-7.1.4 1.7 1.2 2.8 2.4 3.4-.3-3.9 1.3-6.7 4.1-8.9-.2 3 1 4.8 2.6 6.6 1.3 1.5 2.3 3.3 2.3 5.8 0 4.1-3.2 7.1-7.7 7.1Z" className="fill-orange-500 dark:fill-orange-400" />
      <path d="M12 22c-2.2 0-3.7-1.5-3.7-3.5 0-1.8 1.2-3 2.4-4.3.2 1 .7 1.6 1.4 2 .1-1.6.8-2.8 2-3.8.2 1.9 1.7 3.1 1.7 5.6 0 2.3-1.6 4-3.8 4Z" className="fill-amber-300" />
    </>
  ),
  // Moved: a tear, with a glint.
  moved: (
    <>
      <path d="M12 2.6c3.2 4.3 6.6 8.4 6.6 12.4a6.6 6.6 0 0 1-13.2 0c0-4 3.4-8.1 6.6-12.4Z" className="fill-sky-400 dark:fill-sky-300" />
      <path d="M9.2 14.8c0 1.6.9 2.9 2.2 3.4" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-white/80" />
    </>
  ),
  // Strength: the Lord my rock, a mountain with a snowy peak.
  strong: (
    <>
      <path d="M1.8 20.5 9 7.5l3.6 6 2.4-3.5 7.2 10.5Z" className="fill-emerald-600 dark:fill-emerald-400" />
      <path d="M9 7.5 6.6 11.8l1.6-.9 1.2 1.1 1.4-1.2.9.5Z" className="fill-white" />
      <path d="M1.8 20.5h20.4" strokeWidth="1.6" strokeLinecap="round" className="stroke-icon-ink" />
    </>
  ),
};

export function ReactionIcon({ reaction, className }: { reaction: Reaction; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 shrink-0 overflow-visible", className)} aria-hidden>
      {ICONS[reaction]}
    </svg>
  );
}
