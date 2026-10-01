import "server-only";

// Email through Resend's API (https://resend.com). Needs RESEND_API_KEY. EMAIL_FROM is the sender:
// an address on a domain verified in Resend, like "Kept <hello@yourdomain.com>". Until there is
// one, mail goes from onboarding@resend.dev, which Resend only delivers to the account owner's own
// address; a Gmail-style EMAIL_FROM is used as the reply-to then. Without the key nothing is sent.

export const emailReady = () => Boolean(process.env.RESEND_API_KEY);

// Where links in emails point: SITE_URL, else the production address Vercel provides.
export function publicOrigin() {
  const pinned = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (pinned) return pinned;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

// Free mailboxes can't be verified in Resend, so they can't send; they can take replies.
const FREE_MAIL = /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|mac|aol|proton|protonmail)\.[a-z.]+$/i;
const RESEND_SENDER = "onboarding@resend.dev";

// Reads EMAIL_FROM loosely ("Kept <a@b.com>", "Kept a@b.com" or just "a@b.com"). A free-mail
// address (Gmail and the like) becomes the reply-to, sending from Resend's own address instead.
export function senderFrom(value: string | undefined) {
  const raw = (value ?? "").trim();
  const address = raw.match(/[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+/)?.[0] ?? null;
  const name = (address ? raw.replace(address, "") : raw).replace(/[<>"]/g, "").trim() || "Kept";
  if (!address) return { from: `${name} <${RESEND_SENDER}>`, replyTo: undefined };
  if (FREE_MAIL.test(address)) return { from: `${name} <${RESEND_SENDER}>`, replyTo: address };
  return { from: `${name} <${address}>`, replyTo: undefined };
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// One short, plain message: a heading, a line, and a button to the page it's about.
function render(message: { title: string; body: string; url?: string }) {
  const origin = publicOrigin();
  const link = new URL(message.url ?? "/", origin).href;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f4;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f1f1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;padding:28px">
<tr><td style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b7b7b;font-weight:600">Kept</td></tr>
<tr><td style="padding-top:12px;font-family:Georgia,serif;font-size:24px;line-height:1.25;font-weight:600">${escape(message.title)}</td></tr>
<tr><td style="padding-top:10px;font-size:16px;line-height:1.55;color:#3d4b4b">${escape(message.body)}</td></tr>
<tr><td style="padding-top:22px"><a href="${link}" style="display:inline-block;background:#283c4f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px">Open Kept</a></td></tr>
</table>
<p style="max-width:480px;font-size:12px;line-height:1.5;color:#7a8888;padding:16px 8px 0;margin:0">You get this because email is on in Kept’s Settings → Notifications. <a href="${origin}/settings" style="color:#7a8888">Turn it off</a>.</p>
</td></tr></table></body></html>`;
  const text = `${message.title}\n\n${message.body}\n\n${link}\n\nTurn these off in Kept: ${origin}/settings`;
  return { html, text };
}

// Sends one email per address (so no one sees anyone else's). Never throws.
export async function sendEmails(to: string[], message: { title: string; body: string; url?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || to.length === 0) return 0;
  const { from, replyTo } = senderFrom(process.env.EMAIL_FROM);
  const { html, text } = render(message);
  let sent = 0;
  // Resend's batch endpoint takes up to 100 messages a call.
  for (let i = 0; i < to.length; i += 100) {
    const batch = to.slice(i, i + 100).map((address) => ({ from, to: [address], subject: message.title, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
      else console.error("email failed", res.status, await res.text().catch(() => ""));
    } catch (e) {
      console.error("email failed", e);
    }
  }
  return sent;
}
