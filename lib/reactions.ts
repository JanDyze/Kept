// Reactions: held on a verse or card (components/hold-react.tsx), drawn as Kept's own marks
// (components/reaction-icon.tsx). On your own verse it's how it
// speaks to you (verses.reaction); on someone's shared card it's your like, in a kind
// (card_likes.reaction; a plain tap gives the heart).
export const REACTIONS = {
  heart: { label: "Love" },
  amen: { label: "Amen" },
  praise: { label: "Praise" },
  fire: { label: "Fire" },
  moved: { label: "Moved" },
  strong: { label: "Strength" },
} as const;

export type Reaction = keyof typeof REACTIONS;
export const REACTION_KEYS = Object.keys(REACTIONS) as Reaction[];
export const isReaction = (r: unknown): r is Reaction => typeof r === "string" && r in REACTIONS;
