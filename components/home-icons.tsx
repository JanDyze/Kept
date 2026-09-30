// Home card icons, drawn from brand/HomeIcons.png: two tones, the main shape in ink and the
// shape behind it in the accent (--icon-* in globals.css), with small marks and gaps in the tile
// color; both flip for dark mode. Parts move a little when the card is hovered, held or focused
// (the `group-engaged` variant); `motion-safe:` keeps them still. SVGs are overflow-visible so
// moving parts aren't clipped. Static tilts sit on an outer <g transform>, because a CSS
// transform class would replace the attribute.

const svg = "overflow-visible";
const part = "[transform-box:fill-box] origin-center transition-transform duration-300 ease-out";
// A tile-colored outline painted under the fill: leaves a thin gap where a shape overlaps another.
const gap = { strokeWidth: 4, strokeLinejoin: "round", paintOrder: "stroke" } as const;

// A closing quote mark (”) with its ball at the origin; rotate 180 for an opening one (“).
const COMMA = "M2.4 0C2.4 3 .8 5-1.5 5.8L-2 4.8C-.8 4.1 0 3.2.1 2.4A2.4 2.4 0 1 1 2.4 0Z";

export function GamesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* back piece */}
      <g transform="rotate(6 37 32)">
        <g className={`${part} fill-icon-accent motion-safe:group-engaged:translate-x-1 motion-safe:group-engaged:rotate-3`}>
          <rect x="23" y="16" width="26" height="33" rx="5" />
          <circle cx="37" cy="15" r="6" />
          <circle cx="49" cy="32" r="5.5" />
        </g>
      </g>
      {/* front piece, its knob holding the quote marks */}
      <g transform="rotate(-8 14 34)">
        <g className={`${part} motion-safe:group-engaged:-translate-x-0.5 motion-safe:group-engaged:-rotate-3`}>
          <path
            d="M7 18H9.5A5.5 5.5 0 1 1 18.5 18H19Q24 18 24 23V26.5A8.5 8.5 0 1 1 24 39.5V45Q24 50 19 50H7Q2 50 2 45V23Q2 18 7 18Z"
            className="fill-icon-ink stroke-icon-paper"
            {...gap}
          />
          <circle cx="29.5" cy="33" r="5.8" className="fill-icon-paper" />
          <g className="fill-icon-ink">
            <path d={COMMA} transform="translate(27.3 35) rotate(180) scale(.75)" />
            <path d={COMMA} transform="translate(31.7 35) rotate(180) scale(.75)" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function VersesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* cards stacked behind, fanning out on hover while the front card tips forward */}
      <g transform="rotate(8 34 24)">
        <rect
          x="16"
          y="2"
          width="35"
          height="40"
          rx="7"
          className={`${part} delay-75 fill-icon-accent motion-safe:group-engaged:translate-x-1 motion-safe:group-engaged:rotate-12`}
        />
      </g>
      <g transform="rotate(4 28 28)">
        <rect
          x="10"
          y="7"
          width="35"
          height="41"
          rx="7"
          className={`${part} fill-icon-accent stroke-icon-paper motion-safe:group-engaged:translate-x-0.5 motion-safe:group-engaged:rotate-6`}
          {...gap}
        />
      </g>
      {/* front card with a curled corner */}
      <g className={`${part} motion-safe:group-engaged:-translate-x-0.5 motion-safe:group-engaged:-rotate-6`}>
        <rect x="3" y="12" width="36" height="42" rx="7" className="fill-icon-ink stroke-icon-paper" {...gap} />
        <path d="M39 38C38 45 33 51 24 54" fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-icon-paper" />
        <g className="fill-icon-paper">
          <path d={COMMA} transform="translate(14.5 25) scale(1.35)" />
          <path d={COMMA} transform="translate(25 25) scale(1.35)" />
        </g>
      </g>
    </svg>
  );
}

export function BibleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* spine and page block */}
      <rect x="5" y="4" width="16" height="44" rx="7" className="fill-icon-accent" />
      <rect x="8" y="38" width="42" height="13" rx="6" className="fill-icon-ink stroke-icon-paper" {...gap} />
      {/* bookmark ribbon */}
      <path
        d="M18.5 40H25V54L21.75 51 18.5 54Z"
        className={`${part} fill-icon-accent stroke-icon-paper motion-safe:group-engaged:translate-y-1`}
        {...gap}
      />
      {/* cover with the cross */}
      <rect x="15.5" y="2" width="36" height="41" rx="7" className="fill-icon-ink stroke-icon-paper" {...gap} />
      <g className={`${part} fill-icon-paper motion-safe:group-engaged:-translate-y-0.5`}>
        <rect x="31" y="10" width="5" height="23" rx="2.5" />
        <rect x="25.5" y="15.5" width="16" height="5" rx="2.5" />
      </g>
    </svg>
  );
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* three straight slider tracks */}
      <g strokeWidth="6" strokeLinecap="round" className="stroke-icon-ink">
        <path d="M6 13h44" />
        <path d="M6 28h44" />
        <path d="M6 43h44" />
      </g>
      {/* square-ish knobs, set well inside their tracks */}
      <g className="fill-icon-accent stroke-icon-paper" {...gap}>
        <rect x="29" y="5" width="11" height="16" rx="4" className={`${part} motion-safe:group-engaged:-translate-x-3`} />
        <rect x="15" y="20" width="11" height="16" rx="4" className={`${part} delay-75 motion-safe:group-engaged:translate-x-4`} />
        <rect x="33" y="35" width="11" height="16" rx="4" className={`${part} delay-150 motion-safe:group-engaged:-translate-x-4`} />
      </g>
    </svg>
  );
}

export function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <circle cx="28" cy="28" r="23" fill="none" strokeWidth="6.5" className="stroke-icon-ink" />
      {/* marks at north, east, south and west */}
      <g strokeWidth="3.5" strokeLinecap="round" className="stroke-icon-ink">
        <path d="M28 12.5v3M43.5 28h-3M28 43.5v-3M12.5 28h3" />
      </g>
      {/* needle: accent half toward the top right, ink half toward the bottom left; it spins on hover */}
      <g className="origin-[28px_28px] transition-transform duration-700 ease-out motion-safe:group-engaged:rotate-[315deg]">
        <path d="M40.5 15.5L32.2 32.2 23.8 23.8z" className="fill-icon-accent" />
        <path d="M15.5 40.5L23.8 23.8 32.2 32.2z" className="fill-icon-ink" />
        <circle cx="28" cy="28" r="2.6" className="fill-icon-paper" />
      </g>
    </svg>
  );
}

// Friends, for Discover's top bar: two people side by side, the one behind in the accent and the
// one in front in ink, cut from each other by a thin gap in the page color (it sits on the page,
// not a tile). The friend behind leans in when the button is hovered or held.
export function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <g className={`${part} fill-icon-accent motion-safe:group-engaged:-translate-x-0.5 motion-safe:group-engaged:-rotate-6`}>
        <circle cx="38" cy="16" r="8.5" />
        <path d="M24 44V41Q24 28 38 28Q52 28 52 41V44Q52 46 50 46H26Q24 46 24 44Z" />
      </g>
      <g className="stroke-background" strokeWidth="5" strokeLinejoin="round" style={{ paintOrder: "stroke" }}>
        <circle cx="20" cy="22" r="9.5" className="fill-icon-ink" />
        <path d="M4 50V47Q4 33 20 33Q36 33 36 47V50Q36 52 34 52H6Q4 52 4 50Z" className="fill-icon-ink" />
      </g>
    </svg>
  );
}
