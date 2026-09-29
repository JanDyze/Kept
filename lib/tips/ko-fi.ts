import { timingSafeEqual } from "node:crypto";

// Ko-fi's webhook posts a form with one field, `data`, holding JSON. Its verification_token must
// match the one on ko-fi.com → Settings → API (KOFI_VERIFICATION_TOKEN) or the post is not Ko-fi's.

export type KofiTip = {
  externalId: string;
  kind: string;
  fromName: string | null;
  email: string | null;
  message: string | null;
  amountCents: number;
  currency: string;
  monthly: boolean;
  isPublic: boolean;
  paidAt: Date;
};

export type KofiResult = { ok: true; tip: KofiTip } | { ok: false; reason: "bad-request" | "bad-token" };

const text = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function parseKofi(data: string | null, token: string): KofiResult {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(data ?? "") as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "bad-request" };
  }
  if (!body || typeof body !== "object") return { ok: false, reason: "bad-request" };
  if (typeof body.verification_token !== "string" || !sameToken(body.verification_token, token)) return { ok: false, reason: "bad-token" };

  const externalId = text(body.message_id, 200);
  const amount = Number.parseFloat(String(body.amount ?? ""));
  if (!externalId || !Number.isFinite(amount) || amount < 0) return { ok: false, reason: "bad-request" };
  const paidAt = new Date(String(body.timestamp ?? ""));

  return {
    ok: true,
    tip: {
      externalId,
      kind: text(body.type, 50) ?? "Donation",
      fromName: text(body.from_name, 200),
      email: text(body.email, 320)?.toLowerCase() ?? null,
      message: text(body.message, 1000),
      amountCents: Math.round(amount * 100),
      currency: (text(body.currency, 10) ?? "USD").toUpperCase(),
      monthly: body.is_subscription_payment === true,
      isPublic: body.is_public !== false,
      paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
    },
  };
}
