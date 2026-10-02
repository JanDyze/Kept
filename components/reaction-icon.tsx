import type { Reaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";

// Kept's own reaction marks, in place of emoji: flat shapes in their own color, with the
// ink-colored details and paper-colored gaps of the Home icons, so they match light and dark.
// Each is drawn on a 24×24 grid.

// Drawn in the logo's language: thick rounded ribbons that loop and cross with a thin gap where
// one passes over another (a stroke in the page color under the top ribbon), in the two icon
// tones, ink and gold, which flip for dark mode like the Home icons.
const R = { fill: "none", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const gapUnder = { fill: "none", strokeWidth: 6, strokeLinecap: "round", strokeLinejoin: "round", className: "stroke-background" } as const;
const ribbon = "stroke-icon-ink";
// The logo's own shapes (public/logo.svg), for the Kept reaction.
const LOGO_RINGS = "M305.5 929.1C203.6 894.1 135.8 809.6 127.9 707.9C122.6 638.9 147.3 573.1 202.4 509.6C238.6 467.9 303.2 420.8 361.5 393.6C425.3 363.8 481.9 346.7 541.2 339C620.4 328.9 711.5 338 747.3 359.7C759.3 367 775 385.5 771.1 387.9C770.3 388.4 767.9 389.1 765.6 389.4C730.4 395 555.8 447.6 488.4 473C362 520.7 282 578.9 254.4 643.1C246.1 662.5 242.6 689.3 246 708.4C250.4 733.5 263.2 757.7 282.9 778.3C290.7 786.4 290.8 786.6 291.5 793C293.9 816 299.2 849.8 303.1 867.5C306.3 882 313.5 909.8 316.6 919.5C318.5 925.5 320.3 931.3 320.6 932.2C321.3 934.6 321.5 934.6 305.5 929.1Z M669.5 998.9C599.1 994.7 563.7 978.7 536.3 938.4C529.5 928.4 518.5 908.2 519.3 907.3C519.6 907 537.1 905.7 558.2 904.4C660.5 898.1 694 895.2 746 887.9C876.5 869.8 967.2 835.5 1018.1 785C1077.3 726.3 1083.1 644.5 1032.9 578L1022.9 564.7L1021 548.1C1015.4 498.4 1005.4 451.7 991.5 411.1C990.1 407 989 403.5 989 403.2C989 402.4 1008.5 413.3 1018.1 419.5C1080.3 459.9 1133.7 524.3 1159 589.8C1205.7 710.1 1161.3 837.7 1047.5 910.7C957.5 968.3 794.5 1006.4 669.5 998.9Z M873 835.9C873 834.8 874.1 828 875.4 820.7C900.6 684.1 887.7 543.1 839.8 431C807.4 355.1 759 299.4 713.5 285.5C673.8 273.4 626.4 281.7 596.2 306L590.3 310.8L577.4 311.4C528.1 313.9 483.6 322.3 437 337.9C427.4 341.1 419.4 343.6 419.2 343.5C418 342.5 435.1 312.3 446.3 295.5C546.2 146 728.4 115.2 857.5 226C916.3 276.4 964.1 366 987 468.5C1010 571.1 1009.8 693.3 986.7 766.5L983.6 776.5L973.3 786.7C961.4 798.5 945.6 809.5 930.5 816.5C925 819.1 918.2 822.2 915.5 823.5C905.8 828.1 886.5 834.8 877.2 836.8C873.4 837.7 873 837.6 873 835.9Z M610 1155.3C456.9 1143.4 350.4 1017.4 325.6 819C318.8 764.9 319.4 694.2 327 642C329.3 626.2 333 607.1 335.5 598.5C340.1 582.9 365 556.6 393.5 537.3C413.9 523.5 456.9 502.4 455.6 506.8C447.3 534.1 442.8 643.6 447.5 702.5C453.5 778.2 462 823.9 479.4 874.5C519.6 991.7 597.3 1063.7 675 1055.9C698 1053.5 721.4 1044.2 739.4 1030.1C742.6 1027.6 746.2 1024.7 747.5 1023.8C749.1 1022.6 754.6 1021.5 766.6 1020C816 1014 867.6 1003.7 908.8 991.7C913.3 990.4 917 989.4 917 989.6C917 990.8 904.8 1010.6 900.3 1016.8C839.1 1099.9 764.2 1144.7 669.8 1154.5C656.5 1155.9 623 1156.3 610 1155.3Z";
const LOGO_PAGE = "M526 718.9C526 587.3 525.8 592.1 531.7 582C535.7 575.2 546.7 565 555.5 560.1C571.9 550.7 585.1 547 629.1 539.6C664.6 533.5 678.2 530.6 692.5 525.8C725.1 514.9 755.7 494.3 773.8 471.2L780.5 462.6L781.3 469.5C782.8 481.7 781.4 513.2 779 524.5C769.5 568.9 740.5 598.3 693 611.8L686.5 613.7L694.4 614.5C742.4 619.2 787.8 594.3 813.7 549L818 541.5L818 661.9C818 795.4 818.3 788 811.4 802.7C804.9 816.4 791.2 827.9 774.9 833.5L766.5 836.4L685.5 837.1C641 837.5 586.8 838.1 565.2 838.5L526 839.3L526 718.9Z";
const gold = "stroke-icon-accent";

const ICONS: Record<Reaction, React.ReactNode> = {
  // Love: a heart drawn as one ribbon, a gold heart kept inside.
  heart: (
    <>
      <path d="M12 20.2C7.2 16.9 3.8 13.7 3.8 9.7 3.8 7 5.8 5.2 8.1 5.2c1.6 0 3 .9 3.9 2.3.9-1.4 2.3-2.3 3.9-2.3 2.3 0 4.3 1.8 4.3 4.5 0 4-3.4 7.2-8.2 10.5Z" {...R} className={ribbon} />
      <path d="M12 15.3c-2-1.4-3.3-2.7-3.3-4.2 0-1 .7-1.7 1.6-1.7.7 0 1.3.4 1.7 1 .4-.6 1-1 1.7-1 .9 0 1.6.7 1.6 1.7 0 1.5-1.3 2.8-3.3 4.2Z" className="fill-icon-accent" />
    </>
  ),
  // Amen: two ribbons rising to meet, a little glow above.
  amen: (
    <>
      <path d="M11 6.5c-2.6 2.6-4.3 6.2-4.3 10.2v4" {...R} className={ribbon} />
      <path d="M13 6.5c2.6 2.6 4.3 6.2 4.3 10.2v4" {...R} className={ribbon} />
      <path d="M11 6.5c.6-.6 1.4-.6 2 0" {...R} className={ribbon} />
      <path d="M12 1.6v1.6M8.4 2.8l.9 1.2M15.6 2.8l-.9 1.2" {...R} strokeWidth={2} className={gold} />
    </>
  ),
  // Kept: the logo itself, its woven rings in ink round a gold page.
  kept: (
    <g transform="translate(-1.281 -1.383) scale(0.02037)">
      <path d={LOGO_RINGS} className="fill-icon-ink" />
      <path d={LOGO_PAGE} className="fill-icon-accent" />
    </g>
  ),
  // Haha: a ribbon ring of a face, squeezed-shut eyes, a big smile.
  laugh: (
    <>
      <circle cx="12" cy="12" r="9" {...R} className={ribbon} />
      <path d="M7.6 10c.6-.9 1.8-.9 2.4 0M14 10c.6-.9 1.8-.9 2.4 0" {...R} strokeWidth={2} className={ribbon} />
      <path d="M7.4 13.4h9.2c-.4 2.5-2.2 4.1-4.6 4.1s-4.2-1.6-4.6-4.1Z" className="fill-icon-accent" />
    </>
  ),
  // Wow: round eyes, a round gold mouth.
  wow: (
    <>
      <circle cx="12" cy="12" r="9" {...R} className={ribbon} />
      <circle cx="9" cy="9.8" r="1.3" className="fill-icon-ink" />
      <circle cx="15" cy="9.8" r="1.3" className="fill-icon-ink" />
      <ellipse cx="12" cy="15.2" rx="2.1" ry="2.6" className="fill-icon-accent" />
    </>
  ),
  // Teary: a ribbon tear with a gold one inside.
  moved: (
    <>
      <path d="M12 3.2c3 4 6.2 7.7 6.2 11.2a6.2 6.2 0 0 1-12.4 0c0-3.5 3.2-7.2 6.2-11.2Z" {...R} className={ribbon} />
      <path d="M12 10.4c1.3 1.7 2.6 3.2 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.4 1.3-2.9 2.6-4.6Z" className="fill-icon-accent" />
    </>
  ),
  // Fire: a flame of two ribbons, gold at heart.
  fire: (
    <>
      <path d="M12 21.2c-3.9 0-6.6-2.7-6.6-6.3 0-3 1.8-4.8 3.3-6.5.4 1.5 1.1 2.5 2.2 3.1-.3-3.6 1.2-6.1 3.8-8.1-.2 2.7.9 4.4 2.4 6 1.2 1.4 2.1 3 2.1 5.3 0 3.8-2.9 6.5-7.2 6.5Z" className="fill-icon-ink stroke-background" strokeWidth={1.2} strokeLinejoin="round" style={{ paintOrder: "stroke" }} />
      <path d="M12 21.2c-2 0-3.4-1.4-3.4-3.2 0-1.6 1.1-2.7 2.2-3.9.2.9.6 1.5 1.3 1.8.1-1.5.8-2.6 1.9-3.5.2 1.7 1.6 2.8 1.6 5.1 0 2.1-1.5 3.7-3.6 3.7Z" className="fill-icon-accent" />
    </>
  ),
  // Sparkle: a big four-point star, a small gold one.
  praise: (
    <>
      <path d="M9.6 2.8c.5 4.2 2.4 6.2 6.6 6.7-4.2.5-6.1 2.5-6.6 6.7-.5-4.2-2.4-6.2-6.6-6.7 4.2-.5 6.1-2.5 6.6-6.7Z" className="fill-icon-ink" strokeLinejoin="round" />
      <path d="M17.6 13.4c.3 2.3 1.4 3.4 3.7 3.7-2.3.3-3.4 1.4-3.7 3.7-.3-2.3-1.4-3.4-3.7-3.7 2.3-.3 3.4-1.4 3.7-3.7Z" className="fill-icon-accent" />
    </>
  ),
  // Joy: a gold sun, ribbon rays.
  sun: (
    <>
      <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M5.1 18.9l1.7-1.7M17.2 6.8l1.7-1.7" {...R} strokeWidth={2.4} className={ribbon} />
      <circle cx="12" cy="12" r="4.8" className="fill-icon-accent" />
    </>
  ),
  // Star: gold, edged with a ribbon.
  star: (
    <path d="M12 2.6 14.8 8.3l6.2.9-4.5 4.4 1.1 6.2L12 16.9l-5.6 2.9 1.1-6.2L3 9.2l6.2-.9Z" className="fill-icon-accent stroke-icon-ink" strokeWidth={2.2} strokeLinejoin="round" />
  ),
  // Bloom: four looping ribbon petals woven round a gold middle.
  flower: (
    <>
      <path d="M12 9.6C9.4 7.6 9.4 3.4 12 3.4s2.6 4.2 0 6.2Z" {...R} strokeWidth={2.5} className={ribbon} />
      <path d="M14.4 12c2-2.6 6.2-2.6 6.2 0s-4.2 2.6-6.2 0Z" {...R} strokeWidth={2.5} className={ribbon} />
      <path d="M12 14.4c2.6 2 2.6 6.2 0 6.2s-2.6-4.2 0-6.2Z" {...R} strokeWidth={2.5} className={ribbon} />
      <path d="M9.6 12c-2 2.6-6.2 2.6-6.2 0s4.2-2.6 6.2 0Z" {...R} strokeWidth={2.5} className={ribbon} />
      <circle cx="12" cy="12" r="2.9" className="fill-icon-accent stroke-background" strokeWidth={1.4} style={{ paintOrder: "stroke" }} />
    </>
  ),
  // Rainbow: three ribbon arches, gold in the middle.
  rainbow: (
    <>
      <path d="M2.6 18.6a9.4 9.4 0 0 1 18.8 0" {...R} strokeWidth={2.6} className={ribbon} />
      <path d="M6.4 18.6a5.6 5.6 0 0 1 11.2 0" {...R} strokeWidth={2.6} className={gold} />
      <path d="M10 18.6a2 2 0 0 1 4 0" {...R} strokeWidth={2.6} className={ribbon} />
    </>
  ),
  // Peace: a dove of one ribbon curve, a gold wing.
  dove: (
    <>
      <path d="M2.8 14.2c2.8 0 4.6-1.4 6-3.4 1.6-2.4 3.8-3.6 6.2-3.4 1.6.1 2.8.9 3.4 2.1l2.8.6-2.6 1.3c-.4 4-3.6 6.8-7.8 6.8-2.6 0-4.6-1-5.8-2.6L2.4 17Z" className="fill-icon-ink" strokeLinejoin="round" />
      <path d="M9 13.4c1.6-3 4.8-4.8 8-4.4-1.8 3.9-4.8 5.3-8 4.4Z" className="fill-icon-accent stroke-background" strokeWidth={1.2} strokeLinejoin="round" style={{ paintOrder: "stroke" }} />
      <circle cx="17" cy="9.4" r=".9" className="fill-background" />
    </>
  ),
  // Together: two rings woven through each other, ink and gold: gold passes over at the bottom,
  // ink over at the top.
  hug: (
    <>
      <circle cx="9" cy="12" r="5.6" {...R} className={ribbon} />
      <circle cx="15" cy="12" r="5.6" {...gapUnder} strokeWidth={5.6} />
      <circle cx="15" cy="12" r="5.6" {...R} className={gold} />
      <path d="M9.49 6.42A5.6 5.6 0 0 1 13.85 9.20" {...gapUnder} strokeWidth={5.6} strokeLinecap="butt" />
      <path d="M9.49 6.42A5.6 5.6 0 0 1 13.85 9.20" {...R} className={ribbon} />
    </>
  ),
  // Growing: a ribbon stem, one ink leaf and one gold.
  seed: (
    <>
      <path d="M12 21.2v-9" {...R} className={ribbon} />
      <path d="M12 13.4C11.7 9.3 8.9 6.9 4.6 7.1c.2 4.1 3 6.5 7.4 6.3Z" className="fill-icon-ink" />
      <path d="M12 11.2c.4-4.1 3.2-6.9 7.8-7-.1 4.3-3.1 7.1-7.8 7Z" className="fill-icon-accent" />
      <path d="M8.4 21.2h7.2" {...R} strokeWidth={2.4} className={ribbon} />
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
  // Shepherd: a lamb, woolly.
  lamb: (
    <>
      <path d="M7 20.5v-3M10 20.5v-3M14.5 20.5v-3M17.5 20.5v-3" strokeWidth="1.8" strokeLinecap="round" className="stroke-stone-800" />
      <path d="M6.5 17.8c-2 0-3.3-1.6-3-3.3-1-1-1-2.8.3-3.6.1-1.8 1.8-3 3.5-2.5 1-1.3 2.9-1.6 4.2-.7 1.4-1 3.4-.8 4.4.6 1.8-.3 3.4 1 3.3 2.8 1.2.8 1.3 2.6.2 3.5.1 1.8-1.4 3.2-3.2 3.2Z" className="fill-stone-100 stroke-stone-800" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M17 7.5c1.4-.9 3.3-.6 4.3.8.9 1.4.6 3.3-.8 4.2-1.4.8-3 .5-3.9-.6Z" className="fill-stone-800" />
      <circle cx="19.6" cy="9.7" r=".6" className="fill-white" />
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
  // Hope: an anchor.
  anchor: (
    <>
      <circle cx="12" cy="4.6" r="2.2" fill="none" strokeWidth="1.8" className="stroke-icon-ink" />
      <path d="M12 6.8V21M7.5 10.2h9" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-icon-ink" />
      <path d="M3.6 13.6c.4 4.4 4 7.4 8.4 7.4s8-3 8.4-7.4" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-icon-accent" />
      <path d="M2.2 14.8 3.6 12l2.2 2.4ZM21.8 14.8 20.4 12l-2.2 2.4Z" className="fill-icon-accent" />
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
  // My rock: a mountain with a snowy peak, outlined so the snow shows on white.
  strong: (
    <>
      <path d="M1.8 20.5 9 7.5l3.6 6 2.4-3.5 7.2 10.5Z" className="fill-emerald-600 dark:fill-emerald-400" />
      <path d="M9 7.5 6.6 11.8l1.6-.9 1.2 1.1 1.4-1.2.9.5Z" className="fill-white stroke-emerald-800 dark:stroke-transparent" strokeWidth=".6" strokeLinejoin="round" />
      <path d="M1.8 20.5h20.4" strokeWidth="1.6" strokeLinecap="round" className="stroke-icon-ink" />
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
};

// Each one's little motion (globals.css, .rx-*), played while `animate` is on: in the picker and
// on a verse's corner, not in the small counts under cards.
const MOTION: Partial<Record<Reaction, string>> = {
  heart: "rx-hold",
  amen: "rx-press",
  kept: "rx-orbit",
  laugh: "rx-giggle",
  wow: "rx-pop",
  moved: "rx-drip",
  fire: "rx-flicker",
  praise: "rx-twinkle",
  sun: "rx-spin",
  star: "rx-twinkle",
  hug: "rx-orbit",
  flower: "rx-spin",
  rainbow: "rx-bob",
  dove: "rx-flap",
  seed: "rx-sway",
};

export function ReactionIcon({ reaction, animate, className }: { reaction: Reaction; animate?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 shrink-0 overflow-visible", className)} aria-hidden>
      <g className={animate ? cn("rx", MOTION[reaction]) : undefined}>{ICONS[reaction]}</g>
    </svg>
  );
}
