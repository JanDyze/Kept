import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { isEnglishWord } = await import("./dictionary");

describe("isEnglishWord", () => {
  it("accepts everyday words the Bible never uses, plus plurals and verb forms", async () => {
    for (const w of ["happy", "table", "phone", "walked", "praises", "Loving"]) expect(await isEnglishWord(w)).toBe(true);
  });

  it("rejects letter mash", async () => {
    for (const w of ["qzxvk", "aeiou", "hhhhh"]) expect(await isEnglishWord(w)).toBe(false);
  });
});
