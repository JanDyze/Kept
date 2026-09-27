import { describe, expect, it } from "vitest";
import { ratingFromMistakes, schedule } from "@/lib/srs";
import { blankOrder, buildFillBlanks, isRightWord, roundAt, roundBank } from "./fill-blanks";
import { buildMissingWord, missingWordOutcome, scoreGuess } from "./missing-word";
import { seededRandom, shuffle } from "./random";
import { isValidGuess, referenceHint, referenceOutcome } from "./reference-wordle";
import { buildUnscramble, chunkVerse, isNextChunk } from "./unscramble";
import { isName, isStopword, tokenize } from "./words";

const JOHN_3_16 =
  "“For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.";
const verse = (text: string, id = "v1") => ({ id, reference: "John 3:16", translation: "ESV", text });

describe("tokenize", () => {
  it("round-trips the text and keeps punctuation around words", () => {
    const tokens = tokenize(JOHN_3_16);
    expect(tokens.map((t) => t.pre + t.word + t.post).join("")).toBe(JOHN_3_16);
    expect(tokens[0]).toEqual({ pre: "“", word: "For", post: " " });
    expect(tokens.find((t) => t.word === "world")?.post).toBe(", ");
  });

  it("keeps Tagalog contractions as one word", () => {
    expect(tokenize("kaya't ibinigay niya").map((t) => t.word)).toEqual(["kaya't", "ibinigay", "niya"]);
  });

  it("knows filler words in both languages", () => {
    expect(isStopword("The")).toBe(true);
    expect(isStopword("ang")).toBe(true);
    expect(isStopword("world")).toBe(false);
  });

  it("tells names from words that just start a sentence", () => {
    const tokens = tokenize("Jesus wept. Then God spoke to Moses: “Go.”");
    const at = (w: string) => tokens.findIndex((t) => t.word === w);
    expect(isName(tokens, at("Jesus"))).toBe(false); // opens the verse: unknown without the Bible's word list
    expect(isName(tokens, at("Jesus"), new Set(["jesus"]))).toBe(true);
    expect(isName(tokens, at("Then"))).toBe(false);
    expect(isName(tokens, at("God"))).toBe(true);
    expect(isName(tokens, at("Moses"))).toBe(true);
    expect(isName(tokens, at("Go"))).toBe(false);
    expect(isName(tokens, at("wept"))).toBe(false);
  });
});

describe("seeded randomness", () => {
  it("repeats for the same seed and differs for another", () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRandom("user|2026-09-26|unscramble"));
    const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRandom("user|2026-09-26|unscramble"));
    const c = shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRandom("user|2026-09-27|unscramble"));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("Missing Word", () => {
  it("hides a 4–8 letter non-filler word, every occurrence", () => {
    for (let s = 0; s < 20; s++) {
      const p = buildMissingWord(verse(JOHN_3_16), seededRandom(`s${s}`))!;
      expect(p.answer.length).toBeGreaterThanOrEqual(4);
      expect(p.answer.length).toBeLessThanOrEqual(8);
      expect(isStopword(p.answer)).toBe(false);
      for (const i of p.hidden) expect(p.tokens[i].word.toLowerCase()).toBe(p.answer);
    }
  });

  it("returns null when no word fits", () => {
    expect(buildMissingWord(verse("Jesus wept."), seededRandom("x"))).not.toBeNull(); // "Jesus", "wept"
    expect(buildMissingWord(verse("I am he."), seededRandom("x"))).toBeNull();
  });

  it("colors repeated letters like Wordle", () => {
    expect(scoreGuess("world", "world")).toEqual(Array(5).fill("correct"));
    // answer has one "l": the second "l" in the guess is absent
    expect(scoreGuess("hello", "world")).toEqual(["absent", "absent", "absent", "correct", "present"]);
    expect(scoreGuess("LLAMA", "loved")).toEqual(["correct", "absent", "absent", "absent", "absent"]);
  });

  it("wins on the answer and loses after six misses", () => {
    expect(missingWordOutcome({ answer: "world" }, { guesses: ["loved", "World"] })).toBe("won");
    expect(missingWordOutcome({ answer: "world" }, { guesses: Array(6).fill("loved") })).toBe("lost");
    expect(missingWordOutcome({ answer: "world" }, { guesses: ["loved"] })).toBe("playing");
  });
});

describe("Reference", () => {
  const romans = { bookNumber: 45, chapter: 8, verseStart: 28, verseEnd: 29 };

  it("points to the right book first, then chapter, then verse", () => {
    expect(referenceHint({ bookNumber: 43, chapter: 3, verse: 16 }, romans)).toMatchObject({
      book: "higher",
      sameTestament: true,
      near: true,
      chapter: null,
      verse: null,
    });
    expect(referenceHint({ bookNumber: 1, chapter: 1, verse: 1 }, romans)).toMatchObject({
      book: "higher",
      sameTestament: false,
      near: false,
    });
    expect(referenceHint({ bookNumber: 45, chapter: 12, verse: 1 }, romans)).toMatchObject({
      book: "correct",
      chapter: "lower",
      verse: null,
    });
  });

  it("accepts any verse inside a range", () => {
    expect(referenceHint({ bookNumber: 45, chapter: 8, verse: 29 }, romans).verse).toBe("correct");
    expect(referenceHint({ bookNumber: 45, chapter: 8, verse: 30 }, romans).verse).toBe("lower");
    expect(referenceOutcome({ answer: romans }, { guesses: [{ bookNumber: 45, chapter: 8, verse: 28 }] })).toBe("won");
  });

  it("rejects references that don't exist", () => {
    expect(isValidGuess({ bookNumber: 43, chapter: 3, verse: 16 })).toBe(true);
    expect(isValidGuess({ bookNumber: 43, chapter: 22, verse: 1 })).toBe(false);
    expect(isValidGuess({ bookNumber: 67, chapter: 1, verse: 1 })).toBe(false);
  });
});

describe("Fill the Blanks", () => {
  const pool = ["mercy", "grace", "light", "heaven", "father", "spirit"];

  it("blanks about a third of the meaningful words and adds decoys", () => {
    const p = buildFillBlanks([verse(JOHN_3_16)], pool, seededRandom("fb"));
    const blanks = p.verses[0].blanks;
    expect(blanks.length).toBeGreaterThanOrEqual(3);
    expect(blanks).toEqual([...blanks].sort((a, b) => a - b));
    for (const i of blanks) expect(isStopword(p.verses[0].tokens[i].word)).toBe(false);
    const answers = blankOrder(p).map((b) => b.answer);
    expect(p.bank.length).toBe(answers.length + 3);
    for (const a of answers) expect(p.bank).toContain(a);
  });

  it("orders blanks across several verses", () => {
    const p = buildFillBlanks([verse(JOHN_3_16), verse("The LORD is my shepherd; I shall not want.", "v2")], pool, seededRandom("fb2"));
    const order = blankOrder(p);
    expect(order[0].verseIndex).toBe(0);
    expect(order[order.length - 1].verseIndex).toBe(1);
  });

  it("plays one verse per round, each with its own answers plus the decoys", () => {
    const p = buildFillBlanks([verse(JOHN_3_16), verse("The LORD is my shepherd; I shall not want.", "v2")], pool, seededRandom("fb3"));
    const order = blankOrder(p);
    const firstOfSecond = order.findIndex((b) => b.verseIndex === 1);
    expect(roundAt(p, 0)).toBe(0);
    expect(roundAt(p, firstOfSecond)).toBe(1);
    expect(roundAt(p, order.length)).toBe(1); // finished: stays on the last verse

    const decoys = p.bank.filter((w) => !order.some((b) => isRightWord(w, b.answer)));
    for (const round of [0, 1]) {
      const bank = roundBank(p, round);
      const answers = order.filter((b) => b.verseIndex === round).map((b) => b.answer);
      expect(bank.length).toBe(answers.length + decoys.length);
      for (const a of answers) expect(bank).toContain(a);
      for (const d of decoys) expect(bank).toContain(d);
    }
  });

  it("keeps the capital on names in the word bank", () => {
    const text = "“For God so loved the world, that he gave his only Son”";
    for (const seed of ["n1", "n2", "n3", "n4", "n5"]) {
      const p = buildFillBlanks([verse(text)], pool, seededRandom(seed));
      const answers = p.verses[0].blanks.map((i) => p.verses[0].tokens[i].word);
      if (answers.includes("God")) expect(p.bank).toContain("God");
      if (answers.includes("Son")) expect(p.bank).toContain("Son");
      if (answers.includes("loved")) expect(p.bank).toContain("loved");
      for (const w of p.bank) if (!["God", "Son"].includes(w)) expect(w).toBe(w.toLowerCase());
    }
  });

  it("matches words regardless of case and curly apostrophes", () => {
    expect(isRightWord("lord", "LORD")).toBe(true);
    expect(isRightWord("kaya't", "kaya’t")).toBe(true);
  });
});

describe("Unscramble", () => {
  it("keeps tiles to about twelve for long verses", () => {
    const chunks = chunkVerse(JOHN_3_16);
    expect(chunks.length).toBeLessThanOrEqual(12);
    expect(chunks.join(" ")).toBe(JOHN_3_16);
  });

  it("never starts solved and skips very short verses", () => {
    const p = buildUnscramble(verse("The LORD is my shepherd; I shall not want."), seededRandom("u"))!;
    expect(p.order).not.toEqual(p.chunks.map((_, i) => i));
    expect(buildUnscramble(verse("Jesus wept."), seededRandom("u"))).toBeNull();
  });

  it("treats tiles with the same text as interchangeable", () => {
    const p = { verseId: "v", reference: "", translation: "", chunks: ["the", "LORD", "the", "end"], order: [3, 2, 1, 0] };
    expect(isNextChunk(p, [], 2)).toBe(true); // second "the" works first
    expect(isNextChunk(p, [2], 1)).toBe(true);
    expect(isNextChunk(p, [2, 1], 2)).toBe(false); // already used
    expect(isNextChunk(p, [2, 1], 0)).toBe(true);
  });
});

describe("scheduling", () => {
  it("maps mistakes to ratings", () => {
    expect(ratingFromMistakes(0, false)).toBe("good");
    expect(ratingFromMistakes(2, false)).toBe("hard");
    expect(ratingFromMistakes(3, false)).toBe("again");
    expect(ratingFromMistakes(0, true)).toBe("again");
  });

  it("schedules a new verse in days, further out for better recall", () => {
    const now = new Date("2026-09-26T08:00:00Z");
    const good = schedule({ srs: null }, "good", now);
    const again = schedule({ srs: null }, "again", now);
    expect(good.dueAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(24 * 3600 * 1000);
    expect(good.dueAt.getTime()).toBeGreaterThan(again.dueAt.getTime());
    // a run of good recalls keeps spacing reviews further apart
    let card = good;
    let gap = good.dueAt.getTime() - now.getTime();
    for (let i = 0; i < 4; i++) {
      const next = schedule({ srs: card.srs }, "good", card.dueAt);
      const nextGap = next.dueAt.getTime() - card.dueAt.getTime();
      expect(nextGap).toBeGreaterThan(gap);
      gap = nextGap;
      card = next;
    }
    // round-trips through JSON storage
    const next = schedule({ srs: good.srs }, "good", good.dueAt);
    expect(next.dueAt.getTime()).toBeGreaterThan(good.dueAt.getTime());
  });
});

describe("First Letters", () => {
  it("hints the first letter and accepts words regardless of case and punctuation", async () => {
    const { buildFirstLetters, hint, sameWord } = await import("./first-letters");
    expect(hint("world")).toBe("w····");
    expect(sameWord("lord", "LORD")).toBe(true);
    expect(sameWord("kayat", "kaya't")).toBe(true);
    expect(sameWord("", "a")).toBe(false);
    expect(buildFirstLetters(verse("Jesus wept."))).toBeNull();
    expect(buildFirstLetters(verse(JOHN_3_16))?.tokens.length).toBeGreaterThan(20);
  });
});

describe("Spot the Change", () => {
  const pool = ["mercy", "grace", "light", "heaven", "father", "spirit", "truth", "glory", "peace", "earth", "house", "people"];

  it("swaps meaningful words for similar-length words and keeps the originals", async () => {
    const { buildSpotChange, spotOutcome } = await import("./spot-change");
    const p = buildSpotChange(verse(JOHN_3_16), pool, seededRandom("sc"))!;
    expect(p.changed.length).toBe(2);
    expect(p.changed).toEqual([...p.changed].sort((a, b) => a - b));
    const original = tokenize(JOHN_3_16);
    p.changed.forEach((i, k) => {
      expect(p.originals[k]).toBe(original[i].word);
      expect(p.tokens[i].word.toLowerCase()).not.toBe(original[i].word.toLowerCase());
      expect(Math.abs(p.tokens[i].word.length - original[i].word.length)).toBeLessThanOrEqual(1);
    });
    expect(spotOutcome(p, { found: [], misses: 0 })).toBe("playing");
    expect(spotOutcome(p, { found: p.changed, misses: 2 })).toBe("won");
    expect(spotOutcome(p, { found: [], misses: 3 })).toBe("lost");
  });
});

describe("Match Up", () => {
  it("needs two different references and never starts matched", async () => {
    const { buildMatchUp, matchUpOutcome, snippet } = await import("./match-up");
    const a = verse(JOHN_3_16, "a");
    const b = { ...verse("For the wages of sin is death.", "b"), reference: "Romans 6:23" };
    expect(buildMatchUp([a, { ...a, id: "a2" }], seededRandom("m"))).toBeNull(); // same reference twice
    const p = buildMatchUp([a, b], seededRandom("m"))!;
    expect(p.pairs).toHaveLength(2);
    expect(p.textOrder).not.toEqual([0, 1]);
    expect(snippet(JOHN_3_16).endsWith("…")).toBe(true);
    expect(matchUpOutcome(p, { matched: [0, 1], mistakes: 1 })).toBe("won");
  });
});

describe("Two Tongues", () => {
  it("shuffles the right translation among decoys and wins with half right", async () => {
    const { buildTwoTongues, correctCount, twoTonguesOutcome } = await import("./two-tongues");
    const round = (id: string) => ({ verseId: id, reference: id, from: "ESV", to: "MBBTAG", text: "en", match: `tl-${id}`, decoys: ["x", "y", "z"] });
    const p = buildTwoTongues([round("1"), round("2"), round("3"), round("4")], seededRandom("t"))!;
    expect(p.rounds).toHaveLength(3);
    for (const r of p.rounds) expect(r.options[r.answer]).toBe(`tl-${r.verseId}`);
    const right = p.rounds.map((r) => r.answer);
    const wrong = p.rounds.map((r) => (r.answer + 1) % 3);
    expect(correctCount(p, { answers: right })).toBe(3);
    expect(twoTonguesOutcome(p, { answers: [right[0], right[1], wrong[2]] })).toBe("won");
    expect(twoTonguesOutcome(p, { answers: [right[0], wrong[1], wrong[2]] })).toBe("lost");
    expect(buildTwoTongues([{ ...round("1"), decoys: ["x"] }], seededRandom("t"))).toBeNull();
  });
});
