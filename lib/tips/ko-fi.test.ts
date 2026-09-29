import { describe, expect, it } from "vitest";
import { parseKofi } from "./ko-fi";

const TOKEN = "3f2a-token";

// The shape Ko-fi documents for its webhook's `data` field.
const sample = {
  verification_token: TOKEN,
  message_id: "3a1fac0c-f960-4506-a60e-824979a74e74",
  timestamp: "2026-09-29T12:00:00Z",
  type: "Donation",
  is_public: true,
  from_name: "Jo Example",
  message: "Thanks for Kept!",
  amount: "3.00",
  url: "https://ko-fi.com/Home/CoffeeShop?txid=0a1b2c3d",
  email: "Jo@Example.com",
  currency: "USD",
  is_subscription_payment: false,
  is_first_subscription_payment: false,
  kofi_transaction_id: "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
};

describe("parseKofi", () => {
  it("reads a tip", () => {
    const r = parseKofi(JSON.stringify(sample), TOKEN);
    expect(r).toEqual({
      ok: true,
      tip: {
        externalId: sample.message_id,
        kind: "Donation",
        fromName: "Jo Example",
        email: "jo@example.com",
        message: "Thanks for Kept!",
        amountCents: 300,
        currency: "USD",
        monthly: false,
        isPublic: true,
        paidAt: new Date("2026-09-29T12:00:00Z"),
      },
    });
  });

  it("rejects a wrong or missing token", () => {
    expect(parseKofi(JSON.stringify({ ...sample, verification_token: "nope" }), TOKEN)).toEqual({ ok: false, reason: "bad-token" });
    expect(parseKofi(JSON.stringify({ ...sample, verification_token: undefined }), TOKEN)).toEqual({ ok: false, reason: "bad-token" });
  });

  it("rejects bodies that aren't a tip", () => {
    expect(parseKofi(null, TOKEN)).toEqual({ ok: false, reason: "bad-request" });
    expect(parseKofi("not json", TOKEN)).toEqual({ ok: false, reason: "bad-request" });
    expect(parseKofi(JSON.stringify({ ...sample, amount: "abc" }), TOKEN)).toEqual({ ok: false, reason: "bad-request" });
    expect(parseKofi(JSON.stringify({ ...sample, message_id: "" }), TOKEN)).toEqual({ ok: false, reason: "bad-request" });
  });

  it("reads monthly and private tips, and odd amounts", () => {
    const r = parseKofi(JSON.stringify({ ...sample, amount: "150.5", currency: "php", is_subscription_payment: true, is_public: false, message: null }), TOKEN);
    expect(r.ok && r.tip).toMatchObject({ amountCents: 15050, currency: "PHP", monthly: true, isPublic: false, message: null });
  });
});
