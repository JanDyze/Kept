import { describe, expect, it } from "vitest";
import { cardColors, DEFAULT_CARD, readCardStyle } from "./style";

describe("card styles", () => {
  it("reads a saved style and shows anything unreadable as the plain page", () => {
    expect(readCardStyle(DEFAULT_CARD)).toEqual(DEFAULT_CARD);
    expect(readCardStyle(null)).toBeNull();
    expect(readCardStyle({ ...DEFAULT_CARD, bg: { kind: "color", color: "neon" } })).toBeNull();
    expect(readCardStyle({ ...DEFAULT_CARD, font: "comic" })).toBeNull();
  });

  it("only accepts photos by id, within the slider ranges", () => {
    const photo = { kind: "image", image: "9cce2dba-41d6-419d-9947-a1c873a09267", dim: 35, blur: 0, focus: 50 };
    expect(readCardStyle({ ...DEFAULT_CARD, bg: photo })).not.toBeNull();
    expect(readCardStyle({ ...DEFAULT_CARD, bg: { ...photo, image: "../../etc/passwd" } })).toBeNull();
    expect(readCardStyle({ ...DEFAULT_CARD, bg: { ...photo, dim: 100 } })).toBeNull();
  });

  it("puts light text on photos and each color's own text color on colors", () => {
    expect(cardColors({ kind: "image", image: "x", dim: 0, blur: 0, focus: 50 }).fg).toBe("#ffffff");
    expect(cardColors({ kind: "color", color: "paper" }).fg).toBe("#23211c");
    expect(cardColors({ kind: "theme" })).toEqual({});
  });
});
