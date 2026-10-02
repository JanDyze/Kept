// Reactions: held on a verse or card (components/hold-react.tsx), drawn as Kept's own little
// animated marks (components/reaction-icon.tsx). On your own verse it's how it made you feel
// (verses.reaction); on someone's shared card it's your like, in a kind (card_likes.reaction; a
// plain tap gives the heart). Keys are stored, so they never change: retired ones stay here so
// reactions already given still show, but only OFFERED ones are in the picker.
export const REACTIONS = {
  heart: { label: "Love" },
  kept: { label: "Kept" },
  hug: { label: "Together" },
  amen: { label: "Amen" },
  praise: { label: "Sparkle" },
  fire: { label: "Fire" },
  moved: { label: "Teary" },
  sun: { label: "Joy" },
  laugh: { label: "Haha" },
  wow: { label: "Wow" },
  star: { label: "Star" },
  flower: { label: "Bloom" },
  rainbow: { label: "Rainbow" },
  dove: { label: "Peace" },
  seed: { label: "Growing" },
  // Retired from the picker; still drawn for reactions already given.
  aww: { label: "Aww" },
  lamb: { label: "Lamb" },
  crown: { label: "Crown" },
  anchor: { label: "Hope" },
  water: { label: "Water" },
  strong: { label: "Strong" },
  shield: { label: "Faith" },
  sword: { label: "Sword" },
  lamp: { label: "Light" },
  vine: { label: "Grapes" },
  bread: { label: "Bread" },
  bush: { label: "Wonder" },
} as const;

export type Reaction = keyof typeof REACTIONS;
export const isReaction = (r: unknown): r is Reaction => typeof r === "string" && r in REACTIONS;

// What the picker offers, in order.
export const REACTION_KEYS: Reaction[] = [
  "heart", "amen", "kept", "laugh", "wow",
  "moved", "fire", "praise", "sun", "star",
  "hug", "flower", "rainbow", "dove", "seed",
];

// The quick bar's six when nothing's been used yet; recent picks take the front (hold-react.tsx).
export const QUICK_DEFAULT: Reaction[] = ["heart", "amen", "kept", "laugh", "moved", "fire"];
