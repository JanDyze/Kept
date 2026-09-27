import { Caveat, Cormorant_Garamond } from "next/font/google";

// The card faces beyond the app's own (Source Serif, Fraunces, Geist). Not preloaded: they're only
// fetched where a card uses them.
export const classicFace = Cormorant_Garamond({
  variable: "--font-card-classic",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  preload: false,
});

export const handFace = Caveat({
  variable: "--font-card-hand",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  preload: false,
});

export const cardFontVariables = `${classicFace.variable} ${handFace.variable}`;
