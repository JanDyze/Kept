import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { compareVersions, parseChangelog } = await import("./changelog");

describe("changelog", () => {
  it("reads versions, titles and bullets", () => {
    const md = "# Changelog\n\nIntro.\n\n## 0.14.0 — Stars\n\n- One\n- Two `code`\n\n## 0.13.0 — Friends\n\n- Three\n";
    expect(parseChangelog(md)).toEqual([
      { version: "0.14.0", title: "Stars", notes: ["One", "Two `code`"] },
      { version: "0.13.0", title: "Friends", notes: ["Three"] },
    ]);
  });

  it("compares versions as numbers", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("0.14.0", "0.14.0")).toBe(0);
  });
});
