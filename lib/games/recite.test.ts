import { describe, expect, it } from "vitest";
import { buildRecite, grade, joinHeard, passes, reciteOutcome } from "./recite";
import { tokenize } from "./words";

const verse = { id: "v", reference: "John 11:35", translation: "ESV", text: "For God so loved the world, that he gave his only Son." };
const puzzle = buildRecite(verse)!;
const tokens = tokenize(verse.text);

describe("grade", () => {
  it("ignores capitals and punctuation", () => {
    expect(grade(tokens, "for god so loved the world that he gave his only son").errors).toBe(0);
  });

  it("marks a skipped word missing without throwing off the rest", () => {
    const { marks, errors } = grade(tokens, "For God loved the world, that he gave his only Son.");
    expect(errors).toBe(1);
    expect(marks[2]).toBe("missing");
    expect(marks.filter((m) => m === "right")).toHaveLength(tokens.length - 1);
  });

  it("marks a different word wrong and counts extra words", () => {
    const { marks, extra, errors } = grade(tokens, "For God so loved the whole earth, that he gave his only Son.");
    expect(marks[5]).toBe("wrong");
    expect(extra).toBe(1);
    expect(errors).toBe(2);
  });

  it("lets speech be a letter off in longer words", () => {
    expect(grade(tokens, "For God so loved the world that he gave his only Sun", true).errors).toBe(1); // "son" is short
    expect(grade(tokens, "For God so lovd the world that he gave his only Son", true).errors).toBe(0);
    expect(grade(tokens, "For God so lovd the world that he gave his only Son").errors).toBe(1);
  });
});

describe("partway through", () => {
  const john = tokenize("In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God.");

  it("fills a repeated word where it's reached, not further on", () => {
    const { marks } = grade(john, "In", true);
    expect(marks[0]).toBe("right");
    expect(marks.filter((m) => m === "right")).toHaveLength(1);
    expect(grade(john, "In the beginning was the", true).marks.slice(0, 5)).toEqual(Array(5).fill("right"));
    expect(grade(john, "In the beginning was the", true).marks.slice(5).every((m) => m === "missing")).toBe(true);
  });

  it("still finds both when the whole verse is said", () => {
    const { marks } = grade(john, "In the beginning was the Word and the Word was with God and the Word was God He was in the beginning with God", true);
    expect(marks.every((m) => m === "right")).toBe(true);
  });
});

describe("joinHeard", () => {
  it("joins results in order", () => {
    expect(joinHeard(["For God so loved", " the world"])).toBe("For God so loved the world");
  });

  it("drops the repeats Android sends", () => {
    expect(joinHeard(["hello", "hello"])).toBe("hello");
    expect(joinHeard(["For God", "for God so loved", "For God so loved the world"])).toBe("For God so loved the world");
  });
});

describe("outcome", () => {
  it("wins typing only word for word; speech passes at 90%", () => {
    const oneOff = "For God so loved the world, that he gave his Son.";
    expect(passes("type_it", puzzle, oneOff)).toBe(false);
    expect(passes("say_it", puzzle, oneOff)).toBe(true); // 12 words: one miss allowed
  });

  it("ends after three tries", () => {
    expect(reciteOutcome("type_it", puzzle, { attempts: ["a", "b"] })).toBe("playing");
    expect(reciteOutcome("type_it", puzzle, { attempts: ["a", "b", "c"] })).toBe("lost");
    expect(reciteOutcome("type_it", puzzle, { attempts: ["a", verse.text] })).toBe("won");
    expect(reciteOutcome("say_it", puzzle, { attempts: [], gaveUp: true })).toBe("lost");
  });
});
