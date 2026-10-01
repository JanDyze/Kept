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
  // Glory: a burst of glory, one big four-pointed star and a small one.
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
  // Tears, kept in his bottle: a tear, with a glint.
  moved: (
    <>
      <path d="M12 2.6c3.2 4.3 6.6 8.4 6.6 12.4a6.6 6.6 0 0 1-13.2 0c0-4 3.4-8.1 6.6-12.4Z" className="fill-sky-400 dark:fill-sky-300" />
      <path d="M9.2 14.8c0 1.6.9 2.9 2.2 3.4" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-white/80" />
    </>
  ),
  // My rock: a mountain with a snowy peak, outlined so the snow shows on white.
  strong: (
    <>
      <path d="M1.8 20.5 9 7.5l3.6 6 2.4-3.5 7.2 10.5Z" className="fill-emerald-600 dark:fill-emerald-400" />
      <path d="M9 7.5 6.6 11.8l1.6-.9 1.2 1.1 1.4-1.2.9.5Z" className="fill-white stroke-emerald-800 dark:stroke-transparent" strokeWidth=".6" strokeLinejoin="round" />
      <path d="M1.8 20.5h20.4" strokeWidth="1.6" strokeLinecap="round" className="stroke-icon-ink" />
    </>
  ),
  // Joy: a sun, its rays.
  sun: (
    <>
      <g strokeWidth="2" strokeLinecap="round" className="stroke-amber-500 dark:stroke-amber-400">
        <path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7" />
      </g>
      <circle cx="12" cy="12" r="5.6" className="fill-amber-400 dark:fill-amber-300" />
      <path d="M9.6 12.6a2.6 2.6 0 0 0 4.8 0" fill="none" strokeWidth="1.4" strokeLinecap="round" className="stroke-amber-950" />
    </>
  ),
  // Crown of life: gold, three points, three jewels.
  crown: (
    <>
      <path d="M3 8.5 7.4 12 12 5l4.6 7L21 8.5l-1.6 10H4.6Z" className="fill-amber-400 dark:fill-amber-300" strokeLinejoin="round" />
      <path d="M4.6 18.5h14.8v2.2H4.6Z" className="fill-amber-600 dark:fill-amber-500" />
      <circle cx="12" cy="13.6" r="1.5" className="fill-rose-500" />
      <circle cx="7.6" cy="15.2" r="1.1" className="fill-sky-500" />
      <circle cx="16.4" cy="15.2" r="1.1" className="fill-emerald-500" />
    </>
  ),
  // Peace: a dove in flight with an olive leaf.
  dove: (
    <>
      <path d="M3 13.5c2.2-.4 4-1.6 5.4-3.5 1.6-2.2 4-3.4 6.6-3.2 1.7.1 2.9 1 3.6 2.3L21.5 10l-2.8 1.3c-.4 4.3-3.8 7.2-8.2 7.2-2.4 0-4.4-.9-5.8-2.5L2 17.5Z" className="fill-sky-100 stroke-icon-ink dark:fill-sky-50" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9.5 12.5c1.4-2.8 4.3-4.6 7.3-4.4-1.5 3.7-4.2 5.2-7.3 4.4Z" className="fill-sky-300" />
      <circle cx="17.2" cy="8.6" r=".8" className={ink} />
      <path d="M21.5 10c1 .6 1.5 1.5 1.3 2.5-1-.1-1.9-.6-2.4-1.5Z" className="fill-emerald-500" />
    </>
  ),
  // Shepherd: a lamb, woolly.
  lamb: (
    <>
      <path d="M7 20.5v-3M10 20.5v-3M14.5 20.5v-3M17.5 20.5v-3" strokeWidth="1.8" strokeLinecap="round" className="stroke-stone-800" />
      <path d="M6.5 17.8c-2 0-3.3-1.6-3-3.3-1-1-1-2.8.3-3.6.1-1.8 1.8-3 3.5-2.5 1-1.3 2.9-1.6 4.2-.7 1.4-1 3.4-.8 4.4.6 1.8-.3 3.4 1 3.3 2.8 1.2.8 1.3 2.6.2 3.5.1 1.8-1.4 3.2-3.2 3.2Z" className="fill-stone-100 stroke-stone-800" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M17 7.5c1.4-.9 3.3-.6 4.3.8.9 1.4.6 3.3-.8 4.2-1.4.8-3 .5-3.9-.6Z" className="fill-stone-800" />
      <circle cx="19.6" cy="9.7" r=".6" className="fill-white" />
    </>
  ),
  // Hope: an anchor.
  anchor: (
    <>
      <circle cx="12" cy="4.6" r="2.2" fill="none" strokeWidth="1.8" className="stroke-icon-ink" />
      <path d="M12 6.8V21M7.5 10.2h9" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-icon-ink" />
      <path d="M3.6 13.6c.4 4.4 4 7.4 8.4 7.4s8-3 8.4-7.4" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-icon-accent" />
      <path d="M2.2 14.8 3.6 12l2.2 2.4ZM21.8 14.8 20.4 12l-2.2 2.4Z" className="fill-icon-accent" />
    </>
  ),
  // Promise: a rainbow over a cloud.
  rainbow: (
    <>
      <path d="M2.5 17a9.5 9.5 0 0 1 19 0" fill="none" strokeWidth="2.2" className="stroke-rose-500" />
      <path d="M5.2 17a6.8 6.8 0 0 1 13.6 0" fill="none" strokeWidth="2.2" className="stroke-amber-400" />
      <path d="M7.9 17a4.1 4.1 0 0 1 8.2 0" fill="none" strokeWidth="2.2" className="stroke-sky-500" />
      <path d="M13.5 21.5h6.2a2.6 2.6 0 0 0 .3-5.2 3.4 3.4 0 0 0-6.4-.6 2.9 2.9 0 0 0-.1 5.8Z" className="fill-white stroke-icon-ink dark:fill-sky-50" strokeWidth="1.1" strokeLinejoin="round" />
    </>
  ),
  // Living water: a jar pouring, ripples below.
  water: (
    <>
      <path d="M2.5 15.5c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" fill="none" strokeWidth="1.8" strokeLinecap="round" className="stroke-sky-500 dark:stroke-sky-300" />
      <path d="M2.5 20c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" fill="none" strokeWidth="1.8" strokeLinecap="round" className="stroke-sky-400 dark:stroke-sky-200" />
      <path d="M12 2.5c2 2.7 3.8 4.9 3.8 7.1a3.8 3.8 0 0 1-7.6 0c0-2.2 1.8-4.4 3.8-7.1Z" className="fill-sky-400 dark:fill-sky-300" />
    </>
  ),
  // Faith: a shield with a cross.
  shield: (
    <>
      <path d="M12 2.3 20 5v6.2c0 5.1-3.4 8.9-8 10.5-4.6-1.6-8-5.4-8-10.5V5Z" className="fill-sky-600 dark:fill-sky-500" />
      <path d="M12 2.3V21.7C7.4 20.1 4 16.3 4 11.2V5Z" className="fill-sky-700 dark:fill-sky-600" />
      <path d="M12 6.5v10M8 10.5h8" strokeWidth="2.2" strokeLinecap="round" className="stroke-amber-300" />
    </>
  ),
  // Cut to the heart: the Word, a two-edged sword.
  sword: (
    <>
      <path d="M20.8 3.2 19.9 7 9.3 17.6l-2.9-2.9L17 4.1Z" className="fill-slate-300 stroke-icon-ink dark:fill-slate-200" strokeWidth="1" strokeLinejoin="round" />
      <path d="M20.8 3.2 8 16" strokeWidth=".9" className="stroke-slate-500" />
      <path d="M4.3 12.6 11.4 19.7 10 21.1 2.9 14Z" className="fill-amber-500" />
      <path d="M7 17 3.3 20.7" strokeWidth="2.6" strokeLinecap="round" className="stroke-amber-700 dark:stroke-amber-600" />
      <circle cx="2.8" cy="21.2" r="1.3" className="fill-amber-500" />
    </>
  ),
  // Light: an oil lamp, lit.
  lamp: (
    <>
      <path d="M2.5 14c2.4 0 3.3-1.7 6-1.7h7.6c3 0 4.6 1.4 5.4 3.4-1.4 3.1-4.4 4.8-8.5 4.8H9.7C6 20.5 3.6 18.4 2.5 14Z" className="fill-amber-700 dark:fill-amber-600" />
      <path d="M8.5 12.3h7.6c1.2 0 2.2.2 3 .6" fill="none" strokeWidth="1.2" className="stroke-amber-900/60" />
      <path d="M4.6 12.8C2.9 11.4 2.8 9 4.3 7.1c.3 1.3 1 2 1.8 2.3-.1-2.2.8-4.1 2.4-5.4.1 2.3 1.2 3.6 1.4 5.6.2 2.1-1.4 3.8-3.5 3.8a3 3 0 0 1-1.8-.6Z" className="fill-orange-500" />
      <path d="M6.3 12.8c-.8-.5-1-1.7-.4-2.6.2.5.5.8 1 .9 0-.9.4-1.7 1-2.2.1 1 .6 1.6.6 2.4 0 .9-.6 1.6-1.5 1.6Z" className="fill-amber-200" />
    </>
  ),
  // Mustard seed: a seed, sprouting.
  seed: (
    <>
      <path d="M12 21.5V11" strokeWidth="1.8" strokeLinecap="round" className="stroke-emerald-700 dark:stroke-emerald-400" />
      <path d="M12 12.5C11.8 8.6 9 6.2 4.8 6.4c.2 4 2.9 6.3 7.2 6.1Z" className="fill-emerald-500" />
      <path d="M12 10.5c.3-3.8 3-6.6 7.6-6.8-.1 4.2-3 6.9-7.6 6.8Z" className="fill-emerald-400" />
      <ellipse cx="12" cy="21" rx="3.4" ry="1.8" className="fill-amber-700 dark:fill-amber-600" />
    </>
  ),
  // Abide: a cluster of grapes on the vine.
  vine: (
    <>
      <path d="M12 6.5C12 4.5 13 3 15 2" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-amber-800 dark:stroke-amber-600" />
      <path d="M12.5 5c2.2-1.6 5.6-1.4 7.5.5-2.4 1.6-5.6 1.4-7.5-.5Z" className="fill-emerald-500" />
      <g className="fill-purple-600 dark:fill-purple-400">
        <circle cx="9" cy="9.2" r="2.3" /><circle cx="13.6" cy="9.2" r="2.3" />
        <circle cx="6.8" cy="13.2" r="2.3" /><circle cx="11.3" cy="13.2" r="2.3" /><circle cx="15.8" cy="13.2" r="2.3" />
        <circle cx="9" cy="17.2" r="2.3" /><circle cx="13.6" cy="17.2" r="2.3" />
        <circle cx="11.3" cy="21" r="2.1" />
      </g>
      <circle cx="8.3" cy="8.4" r=".7" className="fill-white/60" />
    </>
  ),
  // Daily bread: a loaf, scored.
  bread: (
    <>
      <path d="M2.5 15.5c0-4.6 4.3-8.2 9.5-8.2s9.5 3.6 9.5 8.2c0 2.4-2 4.2-4.4 4.2H6.9c-2.4 0-4.4-1.8-4.4-4.2Z" className="fill-amber-500 dark:fill-amber-400" />
      <path d="M2.5 15.5c0 2.4 2 4.2 4.4 4.2h10.2c2.4 0 4.4-1.8 4.4-4.2-1.6 1.1-4.8 1.8-9.5 1.8s-7.9-.7-9.5-1.8Z" className="fill-amber-700 dark:fill-amber-600" />
      <path d="M8 10.5 9.6 13M11.7 9.6 13.3 12.2M15.4 10.2 17 12.7" strokeWidth="1.4" strokeLinecap="round" className="stroke-amber-100" />
    </>
  ),
  // Wonder: the burning bush, not consumed.
  bush: (
    <>
      <path d="M12 21.5v-3" strokeWidth="2" strokeLinecap="round" className="stroke-amber-800 dark:stroke-amber-600" />
      <path d="M5 19c-2.2 0-3.2-2.4-1.8-4-.8-1.9.7-3.8 2.7-3.5.6-1.6 2.6-2.2 4-1.2 1.3-1 3.3-.8 4.2.6 1.9-.4 3.6 1.2 3.2 3.1 1.6.8 1.8 3 .4 4.1.1.5-.3.9-.8.9Z" className="fill-emerald-600 dark:fill-emerald-500" />
      <path d="M8 11.5c-1.4-1.2-1.4-3.2-.2-4.7.3 1 .8 1.5 1.4 1.7 0-1.9.9-3.6 2.4-4.8.1 2 1 3.2 2.1 4.4.4-.7.5-1.4.4-2.2 1.5 1.2 2.2 2.9 1.8 4.6-.4 1.8-2.1 2.9-4 2.9-1.6 0-3-.6-3.9-1.9Z" className="fill-orange-500" />
      <path d="M10.4 11.4c-.6-.6-.6-1.6 0-2.3.2.4.5.7.8.8.1-.9.5-1.6 1.2-2.1.1 1 .8 1.6.8 2.6 0 .9-.7 1.5-1.5 1.5a1.8 1.8 0 0 1-1.3-.5Z" className="fill-amber-200" />
    </>
  ),
  // Haha: a laughing face, eyes squeezed shut, happy tears.
  laugh: (
    <>
      <circle cx="12" cy="12" r="9.6" className="fill-amber-400 dark:fill-amber-300" />
      <path d="M6.6 9.6c.8-1 2-1 2.8 0M14.6 9.6c.8-1 2-1 2.8 0" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-amber-950" />
      <path d="M6.8 12.8h10.4c0 3-2.3 5.4-5.2 5.4s-5.2-2.4-5.2-5.4Z" className="fill-amber-950" />
      <path d="M9.4 16.6c1.5-1.2 3.7-1.2 5.2 0-.7.9-1.6 1.5-2.6 1.5s-1.9-.6-2.6-1.5Z" className="fill-rose-400" />
      <path d="M3.4 11.2c-.9 1-1.2 2.2-.6 2.8.6.6 1.6.2 2-.9.3-.8.1-1.6-.3-2.2Z M20.6 11.2c.9 1 1.2 2.2.6 2.8-.6.6-1.6.2-2-.9-.3-.8-.1-1.6.3-2.2Z" className="fill-sky-400" />
    </>
  ),
  // Wow: round eyes, little round mouth.
  wow: (
    <>
      <circle cx="12" cy="12" r="9.6" className="fill-amber-400 dark:fill-amber-300" />
      <path d="M6.6 7.2c.8-.7 1.9-.9 2.8-.5M17.4 7.2c-.8-.7-1.9-.9-2.8-.5" fill="none" strokeWidth="1.3" strokeLinecap="round" className="stroke-amber-950" />
      <ellipse cx="8.6" cy="10.4" rx="1.3" ry="1.7" className="fill-amber-950" />
      <ellipse cx="15.4" cy="10.4" rx="1.3" ry="1.7" className="fill-amber-950" />
      <ellipse cx="12" cy="16" rx="2" ry="2.5" className="fill-amber-950" />
    </>
  ),
  // Aww: heart eyes, a smile, pink cheeks.
  aww: (
    <>
      <circle cx="12" cy="12" r="9.6" className="fill-amber-400 dark:fill-amber-300" />
      <path d="M8.6 12.2s-2.6-1.5-2.9-3.1c-.2-1.1.5-2 1.5-2 .6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8 1 0 1.7.9 1.5 2-.3 1.6-2.9 3.1-2.9 3.1Z M15.4 12.2s-2.6-1.5-2.9-3.1c-.2-1.1.5-2 1.5-2 .6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8 1 0 1.7.9 1.5 2-.3 1.6-2.9 3.1-2.9 3.1Z" className="fill-rose-500" />
      <path d="M8.4 15.2c1.9 2 5.3 2 7.2 0" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-amber-950" />
      <circle cx="5.6" cy="14.6" r="1.3" className="fill-rose-400/60" />
      <circle cx="18.4" cy="14.6" r="1.3" className="fill-rose-400/60" />
    </>
  ),
  // Star: a little star, smiling.
  star: (
    <>
      <path d="M12 1.9 15 8.1l6.8.9-5 4.7 1.3 6.7-6.1-3.3-6.1 3.3 1.3-6.7-5-4.7L9 8.1Z" className="fill-amber-300 stroke-amber-500" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="10" cy="11.4" r=".9" className="fill-amber-950" />
      <circle cx="14" cy="11.4" r=".9" className="fill-amber-950" />
      <path d="M10.4 13.6c.9.8 2.3.8 3.2 0" fill="none" strokeWidth="1.1" strokeLinecap="round" className="stroke-amber-950" />
    </>
  ),
  // Bloom: five pink petals round a sunny middle.
  flower: (
    <>
      <g className="fill-pink-400 dark:fill-pink-300">
        <circle cx="12" cy="5.6" r="3.9" />
        <circle cx="18.1" cy="10" r="3.9" />
        <circle cx="15.8" cy="17.2" r="3.9" />
        <circle cx="8.2" cy="17.2" r="3.9" />
        <circle cx="5.9" cy="10" r="3.9" />
      </g>
      <circle cx="12" cy="12" r="3.6" className="fill-amber-300" />
      <circle cx="10.9" cy="11" r="1" className="fill-white/70" />
    </>
  ),
};

// Each one's little motion (globals.css, .rx-*), played while `animate` is on: in the picker and
// on a verse's corner, not in the small counts under cards.
const MOTION: Partial<Record<Reaction, string>> = {
  heart: "rx-beat",
  amen: "rx-wiggle",
  laugh: "rx-giggle",
  wow: "rx-pop",
  moved: "rx-drip",
  aww: "rx-bob",
  fire: "rx-flicker",
  praise: "rx-twinkle",
  sun: "rx-bob",
  star: "rx-twinkle",
  flower: "rx-spin",
  rainbow: "rx-bob",
  dove: "rx-flap",
  lamb: "rx-hop",
  seed: "rx-sway",
};

export function ReactionIcon({ reaction, animate, className }: { reaction: Reaction; animate?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 shrink-0 overflow-visible", className)} aria-hidden>
      <g className={animate ? cn("rx", MOTION[reaction]) : undefined}>{ICONS[reaction]}</g>
    </svg>
  );
}
