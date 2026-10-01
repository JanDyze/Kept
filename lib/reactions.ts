// Reactions: held on a verse or card (components/hold-react.tsx). On your own verse it's how it
// speaks to you (verses.reaction); on someone's shared card it's your like, in a kind
// (card_likes.reaction; a plain tap gives the heart).
export const REACTIONS = {
  heart: { emoji: "❤️", label: "Love" },
  amen: { emoji: "🙏", label: "Amen" },
  praise: { emoji: "🙌", label: "Praise" },
  fire: { emoji: "🔥", label: "Fire" },
  moved: { emoji: "🥹", label: "Moved" },
  strong: { emoji: "💪", label: "Strength" },
} as const;

export type Reaction = keyof typeof REACTIONS;
export const REACTION_KEYS = Object.keys(REACTIONS) as Reaction[];
export const isReaction = (r: unknown): r is Reaction => typeof r === "string" && r in REACTIONS;
