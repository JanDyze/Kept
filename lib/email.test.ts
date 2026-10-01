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

const sent: { from: unknown; to: string; subject: string }[] = [];
let auth: unknown;
vi.mock("nodemailer", () => ({
  createTransport: (opts: { auth: unknown }) => {
    auth = opts.auth;
    return { sendMail: async (m: { from: unknown; to: string; subject: string }) => void sent.push(m), close: () => {} };
  },
}));

describe("sendEmails through Gmail", () => {
  it("sends from the Gmail address, one per person, ahead of Resend", async () => {
    vi.stubEnv("GMAIL_USER", "jdmalaluan2@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("EMAIL_FROM", "Kept jdmalaluan2@gmail.com");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { sendEmails, emailReady } = await import("./email");
    expect(emailReady()).toBe(true);
    expect(await sendEmails(["a@x.com", "b@x.com"], { title: "Good morning", body: "Hi" })).toBe(2);
    expect(auth).toEqual({ user: "jdmalaluan2@gmail.com", pass: "abcdefghijklmnop" });
    expect(sent.map((m) => m.to)).toEqual(["a@x.com", "b@x.com"]);
    expect(sent[0].from).toEqual({ name: "Kept", address: "jdmalaluan2@gmail.com" });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe("gmailSetup", () => {
  it("strips quotes and spaces before signing in", async () => {
    vi.stubEnv("GMAIL_USER", ' "jdmalaluan2@gmail.com" ');
    vi.stubEnv("GMAIL_APP_PASSWORD", "'abcd efgh ijkl mnop'");
    const { gmailSetup } = await import("./email");
    expect(gmailSetup()).toEqual({ user: "jdmalaluan2@gmail.com", length: 16 });
    vi.unstubAllEnvs();
  });
});
