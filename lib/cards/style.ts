import { z } from "zod";

// How a verse's card looks: its background (the theme's card, a color, or one of the user's
// photos), a paper grain, and how the text is set. Stored as jsonb on the verse; null means the
// plain page layout. Shared by the server (validation) and the editor (live preview).

// Deep, calm tones and two light papers, each with the text color that reads on it.
export const CARD_COLORS = {
  ink: { name: "Ink", bg: "#283d4e", fg: "#f4f1ea" },
  night: { name: "Night", bg: "#14181c", fg: "#ece8df" },
  teal: { name: "Teal", bg: "#073031", fg: "#cff5e7" },
  forest: { name: "Forest", bg: "#27402f", fg: "#eef3ea" },
  plum: { name: "Plum", bg: "#3d2b3e", fg: "#f4eaf1" },
  clay: { name: "Clay", bg: "#8a4b32", fg: "#fbf1e8" },
  gold: { name: "Gold", bg: "#d58f28", fg: "#211606" },
  sand: { name: "Sand", bg: "#ece2d0", fg: "#2d2519" },
  mist: { name: "Mist", bg: "#dfe8ea", fg: "#1d2a31" },
  paper: { name: "Paper", bg: "#fbf8f2", fg: "#23211c" },
} as const;
export type CardColor = keyof typeof CARD_COLORS;
const colorIds = Object.keys(CARD_COLORS) as [CardColor, ...CardColor[]];

// Text colors to override the background's own; "auto" keeps the one that reads on it.
export const TEXT_COLORS = {
  white: { name: "White", color: "#ffffff" },
  cream: { name: "Cream", color: "#f4ecd8" },
  gold: { name: "Gold", color: "#e9b54f" },
  mint: { name: "Mint", color: "#cff5e7" },
  blush: { name: "Blush", color: "#f2cfc6" },
  sky: { name: "Sky", color: "#cfe3f2" },
  ink: { name: "Ink", color: "#1d2a31" },
  black: { name: "Black", color: "#111111" },
} as const;
export type TextColor = keyof typeof TEXT_COLORS;
const textColorIds = Object.keys(TEXT_COLORS) as [TextColor, ...TextColor[]];

export const CARD_FONTS = {
  serif: { name: "Serif" },
  classic: { name: "Classic" },
  display: { name: "Display" },
  sans: { name: "Sans" },
  hand: { name: "Hand" },
} as const;
export type CardFont = keyof typeof CARD_FONTS;
const fontIds = Object.keys(CARD_FONTS) as [CardFont, ...CardFont[]];

const background = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("theme") }),
  z.object({ kind: z.literal("color"), color: z.enum(colorIds) }),
  z.object({
    kind: z.literal("image"),
    image: z.uuid(),
    dim: z.number().int().min(0).max(85), // % black laid over the photo so the text reads
    blur: z.number().int().min(0).max(20), // softens a busy photo
    // Which part of the photo shows (0–100, left to right and top to bottom), and how far it's
    // zoomed in. Zoom is what gives a landscape photo room to move on the portrait card. Defaults
    // keep cards saved before these existed readable.
    focusX: z.number().int().min(0).max(100).default(50),
    focus: z.number().int().min(0).max(100),
    zoom: z.number().int().min(100).max(300).default(100),
  }),
]);

export const cardStyleSchema = z.object({
  bg: background,
  grain: z.boolean(),
  text: z.enum(["auto", ...textColorIds]).default("auto"),
  font: z.enum(fontIds),
  size: z.enum(["s", "m", "l"]),
  align: z.enum(["left", "center"]),
  reference: z.enum(["top", "bottom"]),
});

export type CardStyle = z.infer<typeof cardStyleSchema>;
export type CardBackground = CardStyle["bg"];

export const DEFAULT_CARD: CardStyle = {
  bg: { kind: "color", color: "ink" },
  grain: false,
  text: "auto",
  font: "serif",
  size: "m",
  align: "center",
  reference: "bottom",
};

export const IMAGE_DEFAULTS = { dim: 35, blur: 0, focusX: 50, focus: 50, zoom: 100 } as const;

// Anything stored that no longer parses (an old shape, a removed color) shows as the plain page.
export function readCardStyle(value: unknown): CardStyle | null {
  const parsed = cardStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const cardImageUrl = (id: string) => `/api/card-images/${id}`;

// Surface and text color for a card. Unless a text color is chosen, each background brings the one
// that reads on it: its own for colors, white over photos, the theme's on the theme card.
export function cardColors(bg: CardBackground, text: CardStyle["text"] = "auto"): { bg?: string; fg?: string } {
  const base: { bg?: string; fg?: string } =
    bg.kind === "color" ? { bg: CARD_COLORS[bg.color].bg, fg: CARD_COLORS[bg.color].fg } : bg.kind === "image" ? { bg: "#101214", fg: "#ffffff" } : {};
  return text === "auto" ? base : { ...base, fg: TEXT_COLORS[text].color };
}
