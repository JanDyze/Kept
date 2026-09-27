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
    focus: z.number().int().min(0).max(100), // vertical position of the crop, top to bottom
  }),
]);

export const cardStyleSchema = z.object({
  bg: background,
  grain: z.boolean(),
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
  font: "serif",
  size: "m",
  align: "center",
  reference: "bottom",
};

export const IMAGE_DEFAULTS = { dim: 35, blur: 0, focus: 50 } as const;

// Anything stored that no longer parses (an old shape, a removed color) shows as the plain page.
export function readCardStyle(value: unknown): CardStyle | null {
  const parsed = cardStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const cardImageUrl = (id: string) => `/api/card-images/${id}`;

// Text color and surface for a background; photos always get light text over the dimmed image.
export function cardColors(bg: CardBackground): { bg?: string; fg?: string } {
  if (bg.kind === "color") return CARD_COLORS[bg.color];
  if (bg.kind === "image") return { bg: "#101214", fg: "#ffffff" };
  return {};
}
