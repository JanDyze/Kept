import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { senderFrom } = await import("./email");

describe("senderFrom", () => {
  it("uses a verified-domain address as the sender", () => {
    expect(senderFrom("Kept <hello@kept.app>")).toEqual({ from: "Kept <hello@kept.app>", replyTo: undefined });
  });
  it("reads it without angle brackets", () => {
    expect(senderFrom("Kept hello@kept.app")).toEqual({ from: "Kept <hello@kept.app>", replyTo: undefined });
  });
  it("sends from Resend's address with a Gmail address as reply-to", () => {
    expect(senderFrom("Kept jdmalaluan2@gmail.com")).toEqual({ from: "Kept <onboarding@resend.dev>", replyTo: "jdmalaluan2@gmail.com" });
  });
  it("falls back when unset", () => {
    expect(senderFrom(undefined)).toEqual({ from: "Kept <onboarding@resend.dev>", replyTo: undefined });
  });
});
