// The game shelf. Adding a game: write its rules module, a screen in components/games, an icon in
// components/game-icons.tsx, its puzzle builder in lib/games/daily.ts, and a line here.

export const GAME_IDS = [
  "fill_blanks",
  "unscramble",
  "first_letters",
  "missing_word",
  "reference_wordle",
  "spot_change",
  "match_up",
  "two_tongues",
] as const;
export type GameId = (typeof GAME_IDS)[number];

export type GameInfo = {
  id: GameId;
  slug: string; // URL segment
  name: string;
  blurb: string;
  // Recall games test real memory, so their results update the verse's review schedule.
  recall: boolean;
};

export const GAMES: GameInfo[] = [
  { id: "fill_blanks", slug: "fill-the-blanks", name: "Fill the Blanks", blurb: "Tap the missing words back in.", recall: true },
  { id: "unscramble", slug: "unscramble", name: "Unscramble", blurb: "Put the verse back in order.", recall: true },
  { id: "first_letters", slug: "first-letters", name: "First Letters", blurb: "Type the verse from its first letters.", recall: true },
  { id: "missing_word", slug: "missing-word", name: "Missing Word", blurb: "Guess the hidden word in six tries.", recall: false },
  { id: "reference_wordle", slug: "reference", name: "Reference", blurb: "Where is this verse? Six guesses.", recall: false },
  { id: "spot_change", slug: "spot-the-change", name: "Spot the Change", blurb: "Find the words that were swapped.", recall: false },
  { id: "match_up", slug: "match-up", name: "Match Up", blurb: "Pair each reference with its verse.", recall: false },
  { id: "two_tongues", slug: "two-tongues", name: "Two Tongues", blurb: "Match ESV to MBBTAG.", recall: false },
];

export function gameBySlug(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}

export function gameById(id: GameId) {
  return GAMES.find((g) => g.id === id)!;
}
