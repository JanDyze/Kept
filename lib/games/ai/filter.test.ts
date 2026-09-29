import { describe, expect, it } from "vitest";
import { blankOrder, buildFillBlanks } from "../fill-blanks";
import { seededRandom } from "../random";
import { buildSpotChange } from "../spot-change";
import { tokenize } from "../words";
import { pickAlternatives, sameRoot } from "./filter";

const JOHN_3_16 =
  "“For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.";
const verse = (text: string, id = "v1") => ({ id, reference: "John 3:16", translation: "ESV", text });

describe("word alternatives filter", () => {
  const vocab = new Set(["blessed", "saved", "chose", "loves", "loving", "made", "judged", "world", "cursed"]);
  const opts = { vocab, names: new Set(["israel"]), inVerse: new Set(["world", "loved", "god"]) };

  it("keeps real words that aren't the answer, another form of it, or already in the verse", () => {
    const guesses = ["loved", "blessed", ";", "loves", "Israel", "world", "chose", "saved", "##ed", "loving", "zzz", "made"];
    expect(pickAlternatives("loved", guesses, opts)).toEqual(["blessed", "chose", "saved", "made"]);
  });

  it("caps the list and keeps the model's order", () => {
    expect(pickAlternatives("loved", ["made", "judged", "cursed", "saved"], { ...opts, max: 2 })).toEqual(["made", "judged"]);
  });

  it("treats inflections and contained words as the same root", () => {
    expect(sameRoot("loved", "loves")).toBe(true);
    expect(sameRoot("believes", "believe")).toBe(true);
    expect(sameRoot("pag-ibig", "ibig")).toBe(true);
    expect(sameRoot("loved", "saved")).toBe(false);
  });
});

describe("games with alternatives", () => {
  const pool = ["mercy", "grace", "light", "heaven", "father", "spirit", "truth", "glory", "peace", "earth", "house", "people"];

  it("Fill the Blanks takes its decoys from the blanks' alternatives first", () => {
    const first = buildFillBlanks([verse(JOHN_3_16)], pool, seededRandom("fb"));
    const answers = blankOrder(first).map((b) => b.answer);
    const alternatives = Object.fromEntries(answers.map((a, i) => [a, [`fit${i}a`, `fit${i}b`]]));
    const p = buildFillBlanks([verse(JOHN_3_16)], pool, seededRandom("fb"), undefined, alternatives);
    const decoys = p.bank.filter((w) => !answers.includes(w));
    expect(decoys).toHaveLength(3);
    for (const d of decoys) expect(d).toMatch(/^fit\d[ab]$/);
  });

  it("Fill the Blanks makes up missing decoys from the pool", () => {
    const p = buildFillBlanks([verse(JOHN_3_16)], pool, seededRandom("fb"), undefined, { world: ["earth"] });
    const answers = blankOrder(p).map((b) => b.answer);
    expect(p.bank.length).toBe(answers.length + 3);
  });

  it("Spot the Change swaps in a word that fits the place", () => {
    const alternatives = { loved: ["blessed", "saved", "chose"], perish: ["suffer", "die", "fail"] };
    const p = buildSpotChange(verse(JOHN_3_16), pool, seededRandom("sc"), alternatives)!;
    const original = tokenize(JOHN_3_16);
    const swapped = p.changed.map((i) => [original[i].word.toLowerCase(), p.tokens[i].word.toLowerCase()] as const);
    expect(p.changed).toHaveLength(2);
    for (const [from, to] of swapped) expect(alternatives[from as keyof typeof alternatives]).toContain(to);
  });
});
