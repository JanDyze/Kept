import type { GameId } from "@/lib/games/registry";

// Game icons, drawn from brand/GameIcons.png (Fill the Blanks from the user's single drawing): two
// tones, deep teal ink and an amber accent (--icon-* in globals.css), with small marks and gaps in
// the tile color; both flip for dark mode. Parts move a little when the tile is hovered, held or
// focused (the `group-engaged` variant); `motion-safe:` keeps them still. SVGs are
// overflow-visible so moving parts aren't clipped. Static tilts sit on an outer <g transform>,
// because a CSS transform class would replace the attribute.
const svg = "overflow-visible";
const part = "[transform-box:fill-box] origin-center transition-transform duration-300 ease-out";
const ink = "fill-icon-ink";
const accent = "fill-icon-accent";
const mark = "fill-icon-paper";
// A tile-colored outline painted under the fill: leaves a thin gap where a shape overlaps another.
const gap = { strokeWidth: 4, strokeLinejoin: "round", paintOrder: "stroke" } as const;
const letterFont = { textAnchor: "middle", fontFamily: "system-ui, sans-serif", fontWeight: 800 } as const;

type IconProps = { className?: string };

function FillBlanksIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* a verse with an empty blank, underlined */}
      <rect x="2" y="16" width="52" height="38" rx="9" className={ink} />
      <g className={mark}>
        <rect x="9" y="23" width="29" height="4" rx="2" />
        <rect x="9" y="32.5" width="6" height="4" rx="2" />
        <rect x="41" y="32.5" width="6" height="4" rx="2" />
        <rect x="9" y="45" width="35" height="4" rx="2" />
      </g>
      <rect x="19.5" y="30" width="17" height="9" rx="3.5" fill="none" strokeWidth="2.4" className="stroke-icon-paper" />
      <rect x="19" y="41" width="18.5" height="2.6" rx="1.3" className={accent} />
      {/* the word tile, sparkling, about to drop in */}
      <g
        strokeWidth="3"
        strokeLinecap="round"
        className={`${part} stroke-icon-accent motion-safe:group-engaged:-translate-y-1 motion-safe:group-engaged:scale-110`}
      >
        <path d="M38 1v4M28 4.5l2.8 2.8M48 4.5l-2.8 2.8" />
      </g>
      <g transform="rotate(10 38 15)">
        <rect
          x="30"
          y="9"
          width="16"
          height="12"
          rx="3.5"
          className={`${part} ${accent} stroke-icon-paper motion-safe:group-engaged:-translate-x-1 motion-safe:group-engaged:translate-y-1 motion-safe:group-engaged:-rotate-6`}
          {...gap}
        />
      </g>
    </svg>
  );
}

function UnscrambleIcon({ className }: IconProps) {
  const letter = (x: number, y: number, ch: string) => (
    <text x={x} y={y} fontSize="15" {...letterFont} className={mark}>
      {ch}
    </text>
  );
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* arrow carrying a letter over to the right */}
      <g
        fill="none"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${part} stroke-icon-accent motion-safe:group-engaged:-translate-y-1`}
      >
        <path d="M11 19C14 6 37 3 45 16" />
        <path d="M39 15.5L45.5 17 46.5 10.5" />
      </g>
      <g transform="rotate(-10 10 34)">
        <g className={`${part} motion-safe:group-engaged:-rotate-6`}>
          <rect x="0" y="23" width="20" height="21" rx="5" className={ink} />
          {letter(10, 39, "A")}
        </g>
      </g>
      <g transform="rotate(9 46 33)">
        <g className={`${part} delay-75 motion-safe:group-engaged:rotate-6`}>
          <rect x="36" y="22" width="20" height="21" rx="5" className={ink} />
          {letter(46, 38, "B")}
        </g>
      </g>
      <g className={`${part} motion-safe:group-engaged:-translate-y-1`}>
        <rect x="18" y="26" width="20" height="21" rx="5" className={`${accent} stroke-icon-paper`} {...gap} />
        {letter(28, 42, "C")}
      </g>
    </svg>
  );
}

function FirstLettersIcon({ className }: IconProps) {
  const rows = [
    { y: 17, letter: "A", delay: "" },
    { y: 29, letter: "B", delay: "delay-75" },
    { y: 41, letter: "C", delay: "delay-150" },
  ];
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <rect x="3" y="5" width="50" height="46" rx="9" className={ink} />
      {rows.map((r) => (
        <g key={r.y}>
          <text
            x="14"
            y={r.y + 4.6}
            fontSize="13"
            {...letterFont}
            className={`${part} ${r.delay} ${accent} motion-safe:group-engaged:scale-110`}
          >
            {r.letter}
          </text>
          <rect x="22" y={r.y - 2.25} width="24" height="4.5" rx="2.25" className={mark} />
        </g>
      ))}
    </svg>
  );
}

function MissingWordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      <rect x="2" y="7" width="52" height="42" rx="9" className={ink} />
      <g className={mark}>
        <rect x="9" y="13" width="38" height="4.5" rx="2.25" />
        <rect x="9" y="20.5" width="26" height="4.5" rx="2.25" />
        <rect x="9" y="28" width="6" height="4.5" rx="2.25" />
        <rect x="41" y="28" width="6" height="4.5" rx="2.25" />
        <rect x="9" y="38" width="34" height="4.5" rx="2.25" />
      </g>
      {/* the gap in the verse */}
      <g className={`${part} motion-safe:group-engaged:rotate-6 motion-safe:group-engaged:scale-110`}>
        <rect x="17.5" y="25" width="21" height="10.5" rx="5.25" className={accent} />
        <text x="28" y="34" fontSize="10" {...letterFont} className={mark}>
          ?
        </text>
      </g>
    </svg>
  );
}

function ReferenceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* a closed Bible with a reference on the cover */}
      <rect x="4" y="4" width="16" height="44" rx="7" className={accent} />
      <rect x="7" y="38" width="44" height="13" rx="6" className={`${ink} stroke-icon-paper`} {...gap} />
      <path
        d="M17.5 40H24V54L20.75 51 17.5 54Z"
        className={`${part} ${accent} stroke-icon-paper motion-safe:group-engaged:translate-y-1`}
        {...gap}
      />
      <rect x="14.5" y="2" width="38" height="41" rx="7" className={`${ink} stroke-icon-paper`} {...gap} />
      <text
        x="33.5"
        y="27.5"
        fontSize="13"
        letterSpacing="-0.5"
        {...letterFont}
        className={`${part} ${mark} motion-safe:group-engaged:scale-110`}
      >
        3:16
      </text>
    </svg>
  );
}

function SpotChangeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* the original page behind */}
      <g transform="rotate(-8 17 25)">
        <g className={`${part} motion-safe:group-engaged:-translate-x-1 motion-safe:group-engaged:-rotate-3`}>
          <rect x="3" y="7" width="28" height="36" rx="6" className={ink} />
          <g className={mark}>
            <rect x="8" y="14" width="16" height="4" rx="2" />
            <rect x="8" y="21" width="12" height="4" rx="2" />
            <rect x="8" y="28" width="14" height="4" rx="2" />
          </g>
        </g>
      </g>
      {/* the changed page, with the difference circled */}
      <rect x="19" y="12" width="34" height="41" rx="6" className={`${ink} stroke-icon-paper`} {...gap} />
      <g className={mark}>
        <rect x="25" y="19" width="22" height="4" rx="2" />
        <rect x="25" y="26" width="16" height="4" rx="2" />
        <rect x="25" y="34.5" width="4" height="4" rx="2" />
        <rect x="25" y="44" width="14" height="4" rx="2" />
      </g>
      <g className={`${part} motion-safe:group-engaged:scale-110`}>
        <ellipse cx="39" cy="36.5" rx="9" ry="5.5" fill="none" strokeWidth="2.6" className="stroke-icon-paper" />
        <rect x="33" y="34.5" width="12" height="4" rx="2" className={accent} />
      </g>
    </svg>
  );
}

function MatchUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* two puzzle pieces fitted together */}
      <path
        d="M28 16H34A5 5 0 1 1 44 16H47Q52 16 52 21V39Q52 44 47 44H44A5 5 0 1 1 34 44H28Z"
        className={`${part} ${accent} motion-safe:group-engaged:translate-x-0.5 motion-safe:group-engaged:rotate-6`}
      />
      <path
        d="M9 16H11.5A5 5 0 1 1 20.5 16H28V25A5.5 5.5 0 1 1 28 35V44H20.5A5 5 0 1 0 11.5 44H9Q4 44 4 39V21Q4 16 9 16Z"
        className={`${part} ${ink} stroke-icon-paper motion-safe:group-engaged:-translate-x-0.5 motion-safe:group-engaged:-rotate-6`}
        {...gap}
      />
    </svg>
  );
}

function TwoTonguesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* the second language behind, with 文 drawn in strokes */}
      <g className={`${part} delay-75 motion-safe:group-engaged:translate-x-0.5 motion-safe:group-engaged:rotate-6`}>
        <path
          d="M38 14H39A14 14 0 0 1 53 28V32Q53 38 49.5 41L51.5 52 42 46H38A14 14 0 0 1 24 32V28A14 14 0 0 1 38 14Z"
          className={accent}
        />
        <path
          d="M43 21v3M37 25h12M39.5 26C41 32 44 36 49 38.5M46.5 26C45 32 42 36 37 38.5"
          fill="none"
          strokeWidth="2.8"
          strokeLinecap="round"
          className="stroke-icon-paper"
        />
      </g>
      <g className={`${part} motion-safe:group-engaged:-translate-x-0.5 motion-safe:group-engaged:-rotate-6`}>
        <path
          d="M18 8H20A14 14 0 0 1 34 22V26A14 14 0 0 1 20 40H14L5.5 47 7 36Q4 32 4 26V22A14 14 0 0 1 18 8Z"
          className={`${ink} stroke-icon-paper`}
          {...gap}
        />
        <text x="19" y="30.5" fontSize="17" {...letterFont} className={mark}>
          A
        </text>
      </g>
    </svg>
  );
}

function TypeItIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* the verse being typed, with its caret */}
      <rect x="2" y="3" width="40" height="16" rx="6" className={ink} />
      <g className={mark}>
        <rect x="8" y="9" width="12" height="4" rx="2" />
        <rect x="23" y="9" width="8" height="4" rx="2" />
      </g>
      <rect
        x="45.5"
        y="1"
        width="4.5"
        height="20"
        rx="2.25"
        className={`${part} ${accent} motion-safe:group-engaged:translate-x-1 motion-safe:group-engaged:scale-y-110`}
      />
      {/* the keyboard */}
      <rect x="2" y="24" width="52" height="29" rx="8" className={ink} />
      <g className={mark}>
        {[8, 17, 26, 35, 44].map((x) => (
          <rect key={x} x={x} y="29.5" width="4" height="4" rx="1.5" />
        ))}
        {[12.5, 21.5, 30.5, 39.5].map((x) => (
          <rect key={x} x={x} y="37" width="4" height="4" rx="1.5" />
        ))}
      </g>
      <rect
        x="15"
        y="44.5"
        width="26"
        height="4"
        rx="2"
        className={`${part} ${accent} motion-safe:group-engaged:translate-y-0.5`}
      />
    </svg>
  );
}

function SayItIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" className={`${svg} ${className ?? ""}`} aria-hidden>
      {/* a microphone */}
      <path d="M11 25a15 15 0 0 0 30 0" fill="none" strokeWidth="4.5" strokeLinecap="round" className="stroke-icon-ink" />
      <rect x="23.5" y="39" width="5" height="9" className={ink} />
      <rect x="15" y="46.5" width="22" height="6" rx="3" className={ink} />
      <rect x="16" y="3" width="20" height="33" rx="10" className={`${ink} stroke-icon-paper`} {...gap} />
      <g className={mark}>
        <rect x="21" y="12" width="10" height="3.5" rx="1.75" />
        <rect x="21" y="19" width="10" height="3.5" rx="1.75" />
      </g>
      {/* the verse, spoken */}
      <g
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        className={`${part} stroke-icon-accent motion-safe:group-engaged:translate-x-1 motion-safe:group-engaged:scale-110`}
      >
        <path d="M43 12.5a11 11 0 0 1 0 15" />
        <path d="M49.5 6.5a19 19 0 0 1 0 27" />
      </g>
    </svg>
  );
}

const ICONS: Record<GameId, (props: IconProps) => React.JSX.Element> = {
  type_it: TypeItIcon,
  say_it: SayItIcon,
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
