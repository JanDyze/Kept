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
  // How it's played, step by step, for the How to play sheet.
  rules: string[];
  // Recall games test real memory, so their results update the verse's review schedule.
  recall: boolean;
  // The OKLCH hue its Games card is tinted with, so each game has its own feel.
  hue: number;
};

export const GAMES: GameInfo[] = [
  {
    id: "fill_blanks",
    slug: "fill-the-blanks",
    name: "Fill the Blanks",
    blurb: "Tap the missing words back in.",
    rules: [
      "Some words in the verse are blanked out.",
      "Tap words from the bank to fill the blanks, in reading order. A few words in the bank don't belong.",
      "A wrong word is a mistake. Fill every blank to finish; no mistakes is Perfect.",
    ],
    recall: true,
    hue: 150,
  },
  {
    id: "unscramble",
    slug: "unscramble",
    name: "Unscramble",
    blurb: "Put the verse back in order.",
    rules: [
      "The verse is cut into tiles of a word or a short phrase, then shuffled.",
      "Tap the tiles in order to build the verse again from the start.",
      "A tile out of place is a mistake. No mistakes is Perfect.",
    ],
    recall: true,
    hue: 60,
  },
  {
    id: "first_letters",
    slug: "first-letters",
    name: "First Letters",
    blurb: "Type the verse from its first letters.",
    rules: [
      "Each word shows only its first letter, with a dot for every letter left (F·· for “for”).",
      "Type the words in order. Capitals, accents and punctuation don't matter.",
      "A wrong word is a mistake. No mistakes is Perfect.",
    ],
    recall: true,
    hue: 250,
  },
  {
    id: "missing_word",
    slug: "missing-word",
    name: "Missing Word",
    blurb: "Guess the hidden word in six tries.",
    rules: [
      "One word in the verse is hidden. Its boxes show how many letters it has.",
      "Type any real word of that length and press Enter.",
      "Green: right letter, right place. Yellow: in the word, somewhere else. Grey: not in the word.",
      "You have six guesses.",
    ],
    recall: false,
    hue: 115,
  },
  {
    id: "reference_wordle",
    slug: "reference",
    name: "Reference",
    blurb: "Name the book, chapter and verse.",
    rules: [
      "Read the verse, then guess where it's found: book, chapter and verse.",
      "Each guess says whether the answer is earlier or later in the Bible, in the same testament, and within three books.",
      "Once the book is right it points you to the chapter, then to the verse.",
      "You have six guesses.",
    ],
    recall: false,
    hue: 300,
  },
  {
    id: "spot_change",
    slug: "spot-the-change",
    name: "Spot the Change",
    blurb: "Find the words that were swapped.",
    rules: [
      "One to three words in the verse were swapped for different words.",
      "Tap every word that changed.",
      "Tapping a word that wasn't changed costs a life. You have three.",
    ],
    recall: false,
    hue: 15,
  },
  {
    id: "match_up",
    slug: "match-up",
    name: "Match Up",
    blurb: "Pair each reference with its verse.",
    rules: [
      "Up to four of your verses and their references, mixed up.",
      "Pair each reference with the verse it belongs to.",
      "A wrong pair is a mistake. No mistakes is Perfect.",
    ],
    recall: false,
    hue: 200,
  },
  {
    id: "two_tongues",
    slug: "two-tongues",
    name: "Two Tongues",
    blurb: "Match ESV to MBBTAG.",
    rules: [
      "Each round shows a verse in one translation, ESV or MBBTAG.",
      "Pick the same verse in the other translation from the choices.",
      "Up to three rounds. Get at least half right to win.",
    ],
    recall: false,
    hue: 85,
  },
];

export function gameBySlug(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}

export function gameById(id: GameId) {
  return GAMES.find((g) => g.id === id)!;
}
