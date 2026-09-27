import { ViewTransition } from "react";

// Shared elements between a verse's tile in My verses, its page, and the card editor: the same
// named part on both sides morphs into place during navigation (see ::view-transition-*(.morph) in
// globals.css). `default="none"` keeps them still during unrelated transitions; `share` keeps the
// pair morphing.
export const morphName = {
  surface: (id: string) => `verse-${id}`, // the tile / the card
  text: (id: string) => `verse-text-${id}`,
  reference: (id: string) => `verse-ref-${id}`, // plain verses only; a card sets it as a caption
};

// `fill`: a surface whose snapshot should cover its frame as it changes shape (tile → card);
// text keeps its proportions instead of being cropped.
export function Morph({ name, fill, children }: { name: string; fill?: boolean; children: React.ReactNode }) {
  return (
    <ViewTransition name={name} share={fill ? "morph-fill" : "morph"} default="none">
      {children}
    </ViewTransition>
  );
}
