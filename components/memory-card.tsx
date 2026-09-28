import Image from "next/image";
import { Morph, morphName } from "@/components/verse-morph";
import { cardFontVariables } from "@/lib/cards/fonts";
import {
  CARD_SHAPES,
  cardColors,
  cardImageUrl,
  hasBorder,
  TEXT_COLORS,
  type CardFont,
  type CardShape,
  type CardStyle,
} from "@/lib/cards/style";
import { cn } from "@/lib/utils";

// A memory verse as a card, set from its CardStyle. Everything is sized in container units (cqw), so the
// card looks the same as a small preview, in the list, or full width: like an image of itself.
// No hooks, so server pages and the client editor both render it.

const FONT_CLASS: Record<CardFont, string> = {
  serif: "font-serif",
  classic: "font-[family-name:var(--font-card-classic)] font-medium",
  display: "font-brand",
  sans: "font-sans",
  hand: "font-[family-name:var(--font-card-hand)] font-medium",
};

// Faces with a small x-height are set a little larger to match the others.
const FONT_SCALE: Record<CardFont, number> = {
  serif: 1,
  classic: 1.1,
  display: 0.96,
  sans: 0.94,
  hand: 1.22,
};

export function cardFontClass(font: CardFont) {
  return cn(cardFontVariables, FONT_CLASS[font]);
}

// Shorter cards hold less, so their text sets smaller against the same width.
const SHAPE_SCALE: Record<CardShape, number> = { portrait: 1, square: 0.88, landscape: 0.7 };

// Size in cqw: shorter verses set larger; S / M / L scale that.
function textSize(style: CardStyle, length: number) {
  const base =
    length < 90
      ? 8.2
      : length < 160
        ? 7.1
        : length < 260
          ? 6.1
          : length < 400
            ? 5.2
            : length < 600
              ? 4.5
              : 3.9;
  const scale = style.size === "s" ? 0.84 : style.size === "l" ? 1.16 : 1;
  return base * scale * FONT_SCALE[style.font] * SHAPE_SCALE[style.shape];
}

// Widths in cqw; a double line needs more room to show its two strokes.
const BORDER_WIDTH = {
  single: { thin: 0.45, medium: 0.9, thick: 1.6 },
  double: { thin: 1.1, medium: 1.6, thick: 2.4 },
};

// The card's border, on whichever sides are on. At the edge it follows the card's corners; inset
// all round it's a frame with its own corners; inset on some sides it's straight rules.
export function CardBorder({ style }: { style: CardStyle }) {
  const b = style.border;
  if (!hasBorder(b)) return null;
  const width = `${BORDER_WIDTH[b.style === "double" ? "double" : "single"][b.weight]}cqw`;
  const all = b.top && b.right && b.bottom && b.left;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        inset: b.inset ? "4cqw" : 0,
        borderStyle: b.style,
        borderColor: b.color === "auto" ? "currentColor" : TEXT_COLORS[b.color].color,
        borderTopWidth: b.top ? width : 0,
        borderRightWidth: b.right ? width : 0,
        borderBottomWidth: b.bottom ? width : 0,
        borderLeftWidth: b.left ? width : 0,
        borderRadius: b.inset ? (all ? "3cqw" : 0) : "inherit",
        opacity: b.color === "auto" ? 0.55 : 0.95,
      }}
    />
  );
}

// Paper grain: SVG noise laid over the background.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// The background layers (photo, dimming, grain), for the card and for smaller surfaces like the
// verse list. Sits behind content in an `isolate` parent.
export function CardBackdrop({
  style,
  sizes = "(max-width: 640px) 100vw, 36rem",
}: {
  style: CardStyle;
  sizes?: string;
}) {
  const bg = style.bg;
  return (
    <>
      {bg.kind === "image" && (
        <>
          <Image
            src={cardImageUrl(bg.image)}
            alt=""
            fill
            unoptimized
            sizes={sizes}
            draggable={false}
            className="-z-30 object-cover"
            style={{
              objectPosition: `${bg.focusX}% ${bg.focus}%`,
              transformOrigin: `${bg.focusX}% ${bg.focus}%`,
              filter: bg.blur
                ? `blur(${(bg.blur * 0.16).toFixed(2)}cqw)`
                : undefined,
              // zoom in, plus a little extra with blur so its soft edges stay off the card
              transform: `scale(${((bg.zoom / 100) * (1 + bg.blur * 0.006)).toFixed(3)})`,
            }}
          />
          <div
            className="absolute inset-0 -z-20 bg-black"
            style={{ opacity: bg.dim / 100 }}
            aria-hidden
          />
        </>
      )}
      {style.grain && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60 mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
          aria-hidden
        />
      )}
    </>
  );
}

export function MemoryCard({
  style,
  reference,
  translation,
  text,
  morphId,
  className,
}: {
  style: CardStyle;
  reference: string;
  translation: string;
  text: string;
  morphId?: string; // the verse id, so the card morphs from / into its tile (verse-morph.tsx)
  className?: string;
}) {
  const morph = (name: (id: string) => string, node: React.ReactElement) =>
    morphId ? (
      <Morph name={name(morphId)} fill={name === morphName.surface}>
        {node}
      </Morph>
    ) : (
      node
    );
  const colors = cardColors(style.bg, style.text);
  const photo = style.bg.kind === "image";
  const caption = (
    <figcaption
      className={cn(
        "font-sans text-[3.1cqw] font-semibold tracking-[0.14em] uppercase opacity-75",
        style.align === "center" && "text-center",
      )}
    >
      {reference} · {translation}
    </figcaption>
  );

  // The wrapper is the size container; the card inside measures itself against it.
  return (
    <div className={cn("@container w-full", className)}>
      {morph(
        morphName.surface,
        <figure
          className={cn(
            "relative isolate flex w-full flex-col overflow-clip rounded-[6.5cqw]",
            style.shape === "landscape" ? "px-[9cqw] py-[6cqw]" : "p-[8.5cqw]",
            style.bg.kind === "theme"
              ? "border bg-card text-card-foreground"
              : "shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)]",
          )}
          style={{ backgroundColor: colors.bg, color: colors.fg, aspectRatio: CARD_SHAPES[style.shape].ratio }}
        >
          <CardBackdrop style={style} />
          <CardBorder style={style} />
          {style.reference === "top" && caption}
          {morph(
            morphName.text,
            <blockquote
              className={cn(
                "my-auto py-[5cqw] whitespace-pre-line text-pretty",
                cardFontClass(style.font),
                style.font === "hand" ? "leading-[1.22]" : "leading-[1.45]",
                style.align === "center" ? "text-center" : "text-left",
              )}
              style={{
                fontSize: `${textSize(style, text.length).toFixed(2)}cqw`,
                textShadow: photo ? "0 1px 14px rgb(0 0 0 / 0.35)" : undefined,
              }}
            >
              {text}
            </blockquote>,
          )}
          {style.reference === "bottom" && caption}
        </figure>,
      )}
    </div>
  );
}
