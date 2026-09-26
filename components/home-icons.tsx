// Home card icons, drawn from brand/KeptIcons.png: two tones, deep teal ink and an amber
// accent (--icon-* in globals.css), with small marks in the tile color; both flip for dark mode.
// Parts move a little when the card is hovered, held or focused (the `group-engaged` variant);
// `motion-safe:` keeps them still. SVGs are overflow-visible so moving parts aren't clipped.

const svg = "overflow-visible";
const part = "[transform-box:fill-box] origin-center transition-transform duration-300 ease-out";

export function GamesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <g className={`${part} motion-safe:group-engaged:-rotate-6`}>
        <rect x="4" y="4" width="22" height="22" rx="5" className="fill-icon-ink" />
        <path d="M9.5 15.5l4 4 7.5-8.5" fill="none" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-icon-paper" />
      </g>
      <rect x="30" y="4" width="22" height="22" rx="5" className={`${part} fill-icon-accent motion-safe:group-engaged:rotate-6`} />
      <rect x="4" y="30" width="22" height="22" rx="5" className={`${part} fill-icon-ink motion-safe:group-engaged:rotate-3`} />
      <rect x="30" y="30" width="22" height="22" rx="5" className={`${part} fill-icon-ink motion-safe:group-engaged:-rotate-3`} />
    </svg>
  );
}

export function VersesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <rect x="7" y="4" width="42" height="48" rx="7" className="fill-icon-ink" />
      <rect x="14" y="25" width="12" height="4.5" rx="2.25" className="fill-icon-paper" />
      <rect x="14" y="34" width="25" height="4.5" rx="2.25" className="fill-icon-paper" />
      {/* bookmark ribbon */}
      <path className={`${part} fill-icon-accent motion-safe:group-engaged:translate-y-1`} d="M34 4h9v18l-4.5-4-4.5 4z" />
    </svg>
  );
}

export function BibleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* cross with light rays */}
      <g className={`${part} motion-safe:group-engaged:-translate-y-0.5`}>
        <path d="M28 2v14M22.5 7.5h11" strokeWidth="3.4" strokeLinecap="round" className="stroke-icon-accent" />
        <g strokeWidth="3" strokeLinecap="round" className="stroke-icon-accent">
          <path d="M15 8l3 3.5" />
          <path d="M41 8l-3 3.5" />
        </g>
      </g>
      {/* open book: two solid pages meeting at the spine */}
      <path d="M26.5 23c-6-3.5-14-4.5-21-2.5v27c7-2 15-1 21 2.5z" className="fill-icon-ink" />
      <path d="M29.5 23c6-3.5 14-4.5 21-2.5v27c-7-2-15-1-21 2.5z" className="fill-icon-ink" />
      <g strokeWidth="2.8" strokeLinecap="round" className="stroke-icon-paper">
        <path d="M11 29c3.5-.6 7-.2 10 1.2" />
        <path d="M11 35.5c3.5-.6 7-.2 10 1.2" />
        <path d="M35 30.2c3-1.4 6.5-1.8 10-1.2" />
        <path d="M35 36.7c3-1.4 6.5-1.8 10-1.2" />
      </g>
    </svg>
  );
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <g strokeWidth="6" strokeLinecap="round" className="stroke-icon-ink">
        <path d="M5 13h46" />
        <path d="M5 28h46" />
        <path d="M5 43h46" />
      </g>
      <circle cx="33" cy="13" r="7.5" className={`${part} fill-icon-accent motion-safe:group-engaged:-translate-x-4`} />
      <circle cx="43" cy="28" r="7.5" className={`${part} delay-75 fill-icon-accent motion-safe:group-engaged:-translate-x-5`} />
      <circle cx="21" cy="43" r="7.5" className={`${part} delay-150 fill-icon-ink motion-safe:group-engaged:translate-x-4`} />
    </svg>
  );
}

export function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <circle cx="28" cy="28" r="26" className="fill-icon-ink" />
      {/* needle: amber half toward the top right, tile-colored half toward the bottom left */}
      <g className="origin-[28px_28px] transition-transform duration-700 ease-out motion-safe:group-engaged:rotate-[315deg]">
        <path d="M42 14L33 33 23 23z" className="fill-icon-accent" />
        <path d="M14 42L23 23 33 33z" className="fill-icon-paper" />
        <circle cx="28" cy="28" r="3" className="fill-icon-ink" />
      </g>
    </svg>
  );
}
