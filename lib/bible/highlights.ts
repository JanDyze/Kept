// Highlighter colors for the Bible reader (components/chapter-reader.tsx). Stored by key in
// highlights.color; each is a translucent wash so the text stays readable in light and dark.
export const HIGHLIGHTS = {
  yellow: { label: "Yellow", wash: "bg-amber-300/45 dark:bg-amber-300/30", dot: "bg-amber-300" },
  green: { label: "Green", wash: "bg-emerald-300/40 dark:bg-emerald-400/25", dot: "bg-emerald-400" },
  blue: { label: "Blue", wash: "bg-sky-300/45 dark:bg-sky-400/25", dot: "bg-sky-400" },
  pink: { label: "Pink", wash: "bg-pink-300/45 dark:bg-pink-400/25", dot: "bg-pink-400" },
} as const;

export type HighlightColor = keyof typeof HIGHLIGHTS;

export const isHighlightColor = (c: unknown): c is HighlightColor => typeof c === "string" && c in HIGHLIGHTS;
