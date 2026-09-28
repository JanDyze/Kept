import { describe, expect, it } from "vitest";
import { noteWhen } from "./note-when";

describe("note times", () => {
  const now = new Date("2026-09-28T13:00:00Z"); // 9:00 PM in Manila
  const tz = "Asia/Manila";

  it("says today and yesterday in the user's time zone", () => {
    expect(noteWhen(new Date("2026-09-28T01:14:00Z"), tz, now)).toBe("Today, 9:14 AM");
    expect(noteWhen(new Date("2026-09-27T12:30:00Z"), tz, now)).toBe("Yesterday, 8:30 PM");
    // 11:30 PM UTC on the 27th is already the 28th in Manila
    expect(noteWhen(new Date("2026-09-27T23:30:00Z"), tz, now)).toBe("Today, 7:30 AM");
  });

  it("drops the time for earlier years", () => {
    expect(noteWhen(new Date("2026-09-21T11:30:00Z"), tz, now)).toBe("Sep 21, 7:30 PM");
    expect(noteWhen(new Date("2025-03-03T04:00:00Z"), tz, now)).toBe("Mar 3, 2025");
  });
});
