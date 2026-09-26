import type { GameId } from "@/lib/games/registry";

// Game icons, drawn from brand/KeptIcons.png: two tones, deep teal ink and an amber accent
// (--icon-* in globals.css), with small marks in the tile color; both flip for dark mode. Parts
// move a little when the tile is hovered, held or focused (the `group-engaged` variant);
// `motion-safe:` keeps them still. SVGs are overflow-visible so moving parts aren't clipped.
const svg = "overflow-visible";
const part = "[transform-box:fill-box] origin-center transition-transform duration-300 ease-out";
const ink = "fill-icon-ink";
const accent = "fill-icon-accent";
const mark = "fill-icon-paper";

type IconProps = { className?: string };

function FillBlanksIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <rect x="2" y="12" width="52" height="32" rx="9" className={ink} />
      <rect x="9" y="25.5" width="11" height="5" rx="2.5" className={mark} />
      <rect x="25" y="22" width="22" height="12" rx="6" className={`${part} ${accent} motion-safe:group-engaged:-translate-x-1.5`} />
    </svg>
  );
}

function UnscrambleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <g className={`${part} motion-safe:group-engaged:translate-x-1`}>
        <rect x="3" y="5" width="30" height="21" rx="6" className={ink} />
        <rect x="10" y="13.5" width="16" height="4.5" rx="2.25" className={mark} />
      </g>
      <g className={`${part} motion-safe:group-engaged:-translate-x-1`}>
        <rect x="14" y="31" width="30" height="21" rx="6" className={ink} />
        <rect x="21" y="39.5" width="16" height="4.5" rx="2.25" className={mark} />
      </g>
      {/* arrow curving down on the right */}
      <g fill="none" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" className="stroke-icon-accent">
        <path d="M38 12c7 0 11 4 11 12" />
        <path d="M44 20l5 5.5 5-5.5" />
      </g>
    </svg>
  );
}

function FirstLettersIcon({ className }: IconProps) {
  const tiles = [
    { x: 1, letter: "A", tile: accent, delay: "" },
    { x: 19.5, letter: "B", tile: ink, delay: "delay-75" },
    { x: 38, letter: "C", tile: ink, delay: "delay-150" },
  ];
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {tiles.map((t) => (
        <g key={t.x} className={`${part} ${t.delay} motion-safe:group-engaged:-translate-y-0.5`}>
          <rect x={t.x} y="16" width="17" height="24" rx="4" className={t.tile} />
          <text x={t.x + 8.5} y="34" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="800" className={mark}>
            {t.letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

function MissingWordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <rect x="1" y="25.5" width="13" height="5" rx="2.5" className={ink} />
      <rect x="17" y="25.5" width="13" height="5" rx="2.5" className={ink} />
      <g className={`${part} motion-safe:group-engaged:rotate-6`}>
        <rect x="33" y="17" width="22" height="22" rx="5" className={accent} />
        <text x="44" y="34.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="17" fontWeight="800" className={mark}>
          ?
        </text>
      </g>
    </svg>
  );
}

function ReferenceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <path d="M26.5 29c-6-3.5-14-4.5-21-2.5v24c7-2 15-1 21 2.5z" className={ink} />
      <path d="M29.5 29c6-3.5 14-4.5 21-2.5v24c-7-2-15-1-21 2.5z" className={ink} />
      <g strokeWidth="2.8" strokeLinecap="round" className="stroke-icon-paper">
        <path d="M11 35c3.5-.6 7-.2 10 1.2" />
        <path d="M11 41.5c3.5-.6 7-.2 10 1.2" />
        <path d="M35 36.2c3-1.4 6.5-1.8 10-1.2" />
        <path d="M35 42.7c3-1.4 6.5-1.8 10-1.2" />
      </g>
      {/* pin above the spine */}
      <g className={`${part} motion-safe:group-engaged:translate-y-0.5`}>
        <path d="M28 1c-6.4 0-11.2 4.8-11.2 10.8 0 7.8 11.2 17.2 11.2 17.2s11.2-9.4 11.2-17.2C39.2 5.8 34.4 1 28 1z" className={accent} />
        <circle cx="28" cy="11.5" r="4.2" className={mark} />
      </g>
    </svg>
  );
}

function SpotChangeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <rect x="1" y="9" width="40" height="30" rx="7" className={ink} />
      <rect x="8" y="17" width="16" height="4.5" rx="2.25" className={mark} />
      <rect x="8" y="26.5" width="12" height="4.5" rx="2.25" className={mark} />
      {/* magnifier: amber ring, tile-colored lens, ink handle */}
      <g className={`${part} motion-safe:group-engaged:-translate-x-1.5 motion-safe:group-engaged:-translate-y-1`}>
        <path d="M44 43l9 9" strokeWidth="6" strokeLinecap="round" className="stroke-icon-ink" />
        <circle cx="37" cy="36" r="11" className={accent} />
        <circle cx="37" cy="36" r="6" className={mark} />
      </g>
    </svg>
  );
}

function MatchUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* two crossed links: ink from top-left to bottom-right, amber from bottom-left to top-right */}
      <g className={`${part} motion-safe:group-engaged:rotate-6`}>
        <path d="M11 11L45 45" strokeWidth="6" strokeLinecap="round" className="stroke-icon-ink" />
        <circle cx="10" cy="10" r="7" className={ink} />
        <circle cx="46" cy="46" r="7" className={ink} />
      </g>
      <g className={`${part} motion-safe:group-engaged:-rotate-6`}>
        <path d="M11 45L45 11" strokeWidth="6" strokeLinecap="round" className="stroke-icon-accent" />
        <circle cx="10" cy="46" r="7" className={accent} />
        <circle cx="46" cy="10" r="7" className={accent} />
      </g>
    </svg>
  );
}

function TwoTonguesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <g className={`${part} motion-safe:group-engaged:-rotate-6`}>
        <path d="M1 8a7 7 0 0 1 7-7h19a7 7 0 0 1 7 7v13a7 7 0 0 1-7 7H13l-8 7v-7.6A7 7 0 0 1 1 21z" className={ink} />
        <text x="17.5" y="19.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="800" className={mark}>
          EN
        </text>
      </g>
      <g className={`${part} delay-75 motion-safe:group-engaged:rotate-6`}>
        <path d="M55 31a7 7 0 0 0-7-7H30a7 7 0 0 0-7 7v13a7 7 0 0 0 7 7h13l8 5v-5.6a7 7 0 0 0 4-6.4z" className={accent} />
        <text x="39" y="42.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="800" className={mark}>
          TL
        </text>
      </g>
    </svg>
  );
}

const ICONS: Record<GameId, (props: IconProps) => React.JSX.Element> = {
  fill_blanks: FillBlanksIcon,
  unscramble: UnscrambleIcon,
  first_letters: FirstLettersIcon,
  missing_word: MissingWordIcon,
  reference_wordle: ReferenceIcon,
  spot_change: SpotChangeIcon,
  match_up: MatchUpIcon,
  two_tongues: TwoTonguesIcon,
};

export function GameIcon({ game, className }: { game: GameId; className?: string }) {
  const Icon = ICONS[game];
  return <Icon className={className} />;
}
