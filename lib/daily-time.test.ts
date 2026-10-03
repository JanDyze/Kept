import { describe, expect, it } from "vitest";
import { hourLabel, localParts, reminderDue } from "./daily-time";

// 2026-10-03 23:10 UTC = 2026-10-04 07:10 in Manila (UTC+8).
const at = new Date("2026-10-03T23:10:00Z");

describe("reminderDue", () => {
  it("reads the local date and hour", () => {
    expect(localParts("Asia/Manila", at)).toEqual({ date: "2026-10-04", hour: 7 });
  });
  it("is due at the chosen hour, once a day", () => {
    expect(reminderDue({ timeZone: "Asia/Manila", hour: 7, lastOn: null }, at)).toEqual({ due: true, date: "2026-10-04" });
    expect(reminderDue({ timeZone: "Asia/Manila", hour: 7, lastOn: "2026-10-04" }, at).due).toBe(false);
  });
  it("waits for a later hour, and skips the day once it's long past", () => {
    expect(reminderDue({ timeZone: "Asia/Manila", hour: 9, lastOn: null }, at).due).toBe(false);
    expect(reminderDue({ timeZone: "Asia/Manila", hour: 2, lastOn: null }, at).due).toBe(false);
    expect(reminderDue({ timeZone: "Asia/Manila", hour: 5, lastOn: "2026-10-03" }, at).due).toBe(true);
  });
  it("follows each person's own time zone", () => {
    // 23:10 UTC is 19:10 in New York.
    expect(reminderDue({ timeZone: "America/New_York", hour: 19, lastOn: null }, at).due).toBe(true);
    expect(reminderDue({ timeZone: "America/New_York", hour: 7, lastOn: null }, at).due).toBe(false);
  });
  it("labels hours", () => {
    expect([0, 7, 12, 19].map(hourLabel)).toEqual(["12 am", "7 am", "12 pm", "7 pm"]);
  });
});
