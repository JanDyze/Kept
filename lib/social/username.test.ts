import { describe, expect, it } from "vitest";
import { guestUsername, isGuestUsername, usernameProblem } from "./username";

describe("guest usernames", () => {
  it("are valid names that read as guests", () => {
    for (let i = 0; i < 20; i++) {
      const name = guestUsername();
      expect(isGuestUsername(name)).toBe(true);
      expect(name).toMatch(/^[a-z0-9][a-z0-9_.]{2,19}$/);
    }
  });

  it("can't be picked by hand, so a saved account never looks like a guest", () => {
    expect(usernameProblem("guest.abc234")).toBe("That name is taken.");
    expect(usernameProblem("guestbook")).toBeNull();
    expect(isGuestUsername("guest.abc")).toBe(false);
  });
});
