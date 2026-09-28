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

  it("reads photo cards saved before position and zoom existed as centered and unzoomed", () => {
    const old = { kind: "image", image: "9cce2dba-41d6-419d-9947-a1c873a09267", dim: 35, blur: 0, focus: 20 };
    expect(readCardStyle({ ...DEFAULT_CARD, bg: old })?.bg).toMatchObject({ focusX: 50, focus: 20, zoom: 100 });
  });

  it("puts light text on photos and each color's own text color on colors", () => {
    expect(cardColors({ kind: "image", image: "x", dim: 0, blur: 0, focusX: 50, focus: 50, zoom: 100 }).fg).toBe("#ffffff");
    expect(cardColors({ kind: "color", color: "paper" }).fg).toBe("#23211c");
    expect(cardColors({ kind: "theme" })).toEqual({});
    expect(cardColors({ kind: "color", color: "paper" }, "gold")).toEqual({ bg: "#fbf8f2", fg: "#e9b54f" });
    expect(readCardStyle({ ...DEFAULT_CARD, text: undefined })?.text).toBe("auto");
  });
});

describe("card shapes and borders", () => {
  it("reads cards saved before shapes and borders as portrait with no border", () => {
    const { shape, border, ...older } = DEFAULT_CARD;
    void shape;
    void border;
    const read = readCardStyle(older);
    expect(read?.shape).toBe("portrait");
    expect(read?.border.top || read?.border.right || read?.border.bottom || read?.border.left).toBe(false);
  });

  it("keeps a border on chosen sides only", () => {
    const border = { ...DEFAULT_CARD.border, top: true, bottom: true, style: "double" };
    expect(readCardStyle({ ...DEFAULT_CARD, shape: "landscape", border })?.border).toMatchObject({ top: true, left: false, style: "double" });
    expect(readCardStyle({ ...DEFAULT_CARD, border: { ...border, style: "wavy" } })).toBeNull();
  });
});
