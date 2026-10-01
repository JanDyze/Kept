// Reactions: held on a verse or card (components/hold-react.tsx), drawn as Kept's own marks
// (components/reaction-icon.tsx). Each is an image from Scripture with the verse it comes from.
// On your own verse it's how it speaks to you (verses.reaction); on someone's shared card it's
// your like, in a kind (card_likes.reaction; a plain tap gives the heart). Keys are stored, so
// they never change; labels and order can.
export const REACTIONS = {
  // Worship
  heart: { label: "Love", ref: "1 Cor 13:13", group: "worship" },
  amen: { label: "Amen", ref: "Phil 4:6", group: "worship" },
  praise: { label: "Glory", ref: "Ps 150:6", group: "worship" },
  crown: { label: "Crown of life", ref: "Jas 1:12", group: "worship" },
  sun: { label: "Joy", ref: "Neh 8:10", group: "worship" },
  // Comfort
  dove: { label: "Peace", ref: "John 14:27", group: "comfort" },
  moved: { label: "Tears", ref: "Ps 56:8", group: "comfort" },
  lamb: { label: "Shepherd", ref: "Ps 23:1", group: "comfort" },
  anchor: { label: "Hope", ref: "Heb 6:19", group: "comfort" },
  rainbow: { label: "Promise", ref: "Gen 9:13", group: "comfort" },
  water: { label: "Living water", ref: "John 4:14", group: "comfort" },
  // Strength
  strong: { label: "My rock", ref: "Ps 18:2", group: "strength" },
  shield: { label: "Faith", ref: "Eph 6:16", group: "strength" },
  sword: { label: "Cut to the heart", ref: "Heb 4:12", group: "strength" },
  fire: { label: "On fire", ref: "Jer 20:9", group: "strength" },
  lamp: { label: "Light", ref: "Ps 119:105", group: "strength" },
  // Growth
  seed: { label: "Mustard seed", ref: "Matt 17:20", group: "growth" },
  vine: { label: "Abide", ref: "John 15:5", group: "growth" },
  bread: { label: "Daily bread", ref: "Matt 6:11", group: "growth" },
  bush: { label: "Wonder", ref: "Exod 3:3", group: "growth" },
} as const;

export type Reaction = keyof typeof REACTIONS;
export const REACTION_KEYS = Object.keys(REACTIONS) as Reaction[];
export const isReaction = (r: unknown): r is Reaction => typeof r === "string" && r in REACTIONS;

export const REACTION_GROUPS = [
  { id: "worship", label: "Worship" },
  { id: "comfort", label: "Comfort" },
  { id: "strength", label: "Strength" },
  { id: "growth", label: "Growth" },
] as const;

// The quick bar's six when nothing's been used yet; recent picks take the front (hold-react.tsx).
export const QUICK_DEFAULT: Reaction[] = ["heart", "amen", "praise", "fire", "moved", "dove"];
