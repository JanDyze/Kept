// Story images (1080×1920, 9:16) for Instagram and Facebook Stories. A web page can't open their
// story editors itself, so the image goes to the phone's share sheet, where both offer "Story".
// Each story is laid out in the page's own DOM (off screen) and captured like the card image, so
// the app's fonts carry over.

const W = 360; // CSS px; captured at 3× → 1080×1920
const H = 640;
// Instagram lays its reply bar over the bottom ~12% of a story, so marks sit above it (88px).
const NAVY = "#283D4E";
const PAPER = "#F1EDE4";
const GOLD = "#E3B25C";

type Ground = { bg: string; fg: string; dark: boolean };
const NAVY_GROUND: Ground = { bg: NAVY, fg: "#fff", dark: true };
const PAPER_GROUND: Ground = { bg: PAPER, fg: NAVY, dark: false };

function frame(ground: Ground = NAVY_GROUND) {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${W}px`,
    height: `${H}px`,
    background: ground.bg,
    color: ground.fg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 30px 40px",
    boxSizing: "border-box",
    textAlign: "center",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.append(el);
  return el;
}

function add<K extends keyof HTMLElementTagNameMap>(parent: HTMLElement, tag: K, style: Partial<CSSStyleDeclaration>, className = "") {
  const el = document.createElement(tag);
  Object.assign(el.style, style);
  if (className) el.className = className;
  parent.append(el);
  return el;
}

// The Kept mark at the foot of a story: white on navy, navy (the logo's own color) on paper.
function signature(parent: HTMLElement, ground: Ground = NAVY_GROUND) {
  const row = add(parent, "div", { position: "absolute", bottom: "88px", left: "0", right: "0", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" });
  const logo = add(row, "img", { width: "18px", height: "18px", filter: ground.dark ? "brightness(0) invert(1)" : "none", opacity: "0.9" });
  logo.src = "/logo.svg";
  logo.alt = "";
  const name = add(row, "span", { fontSize: "15px", fontWeight: "600", letterSpacing: "-0.01em", opacity: "0.9" }, "font-brand");
  name.textContent = "Kept";
}

async function capture(el: HTMLElement) {
  try {
    await Promise.all([...el.querySelectorAll("img")].map((img) => img.decode().catch(() => {})));
    await document.fonts?.ready;
    const { domToBlob } = await import("modern-screenshot");
    const blob = await domToBlob(el, { scale: 3, width: W, height: H, type: "image/png", fetch: { requestInit: { credentials: "same-origin" } } });
    if (!blob) throw new Error("no image");
    return blob;
  } finally {
    el.remove();
  }
}

// Whether a card reads as dark, from its surface just inside the top edge (clear of the text).
async function isDark(card: Blob) {
  try {
    const bmp = await createImageBitmap(card);
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    ctx.drawImage(bmp, Math.round(bmp.width / 2), Math.round(bmp.height * 0.03), 1, 1, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
  } catch {
    return true;
  }
}

// A card (already drawn as an image), centered: on paper when the card is dark, else on navy, so it
// never sinks into the ground (the default card is Kept navy itself).
export async function cardStory(card: Blob) {
  const ground = (await isDark(card)) ? PAPER_GROUND : NAVY_GROUND;
  const el = frame(ground);
  const url = URL.createObjectURL(card);
  try {
    const img = add(el, "img", { width: "100%", maxHeight: "480px", objectFit: "contain", filter: "drop-shadow(0 10px 24px rgb(0 0 0 / 0.3))" });
    img.src = url;
    img.alt = "";
    signature(el, ground);
    return await capture(el);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// A verse without a card: its words in the scripture face, the reference in gold beneath.
export async function verseStory({ reference, text }: { reference: string; text: string }) {
  const el = frame();
  const n = text.length;
  const size = n < 110 ? 26 : n < 220 ? 22 : n < 360 ? 18 : n < 520 ? 15.5 : 13;
  const words = add(el, "p", { fontSize: `${size}px`, lineHeight: "1.45", whiteSpace: "pre-line", margin: "0" }, "font-serif");
  words.textContent = text;
  const ref = add(el, "p", { marginTop: "22px", fontSize: "14px", fontWeight: "600", letterSpacing: "0.02em", color: GOLD }, "font-brand");
  ref.textContent = reference;
  signature(el);
  return capture(el);
}

// Kept itself: the mark, the name, what it's for, and where to find it.
export async function keptStory() {
  const el = frame();
  const logo = add(el, "img", { width: "92px", height: "92px", filter: "brightness(0) invert(1)" });
  logo.src = "/logo.svg";
  logo.alt = "";
  const name = add(el, "p", { marginTop: "22px", fontSize: "44px", fontWeight: "600", letterSpacing: "-0.02em", lineHeight: "1" }, "font-brand");
  name.textContent = "Kept";
  const line = add(el, "p", { marginTop: "14px", fontSize: "16px", lineHeight: "1.45", opacity: "0.8", maxWidth: "280px", textWrap: "balance" });
  line.textContent = "Memorize Scripture, one verse at a time.";
  const where = add(el, "p", { position: "absolute", bottom: "88px", left: "0", right: "0", fontSize: "14px", fontWeight: "600", color: GOLD });
  where.textContent = location.host;
  return capture(el);
}

export const canShareFiles = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [new File([""], "story.png", { type: "image/png" })] });

// Hands the image to the share sheet (Instagram → Story, Facebook → Story, ...), or saves it where
// the browser can't share files. A cancelled share is not an error.
export async function shareImage(blob: Blob, name: string) {
  const file = new File([blob], name, { type: "image/png" });
  if (canShareFiles()) {
    await navigator.share({ files: [file] }).catch((e: unknown) => {
      if (!(e instanceof DOMException && e.name === "AbortError")) throw e;
    });
    return;
  }
  const href = URL.createObjectURL(file);
  Object.assign(document.createElement("a"), { href, download: file.name }).click();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
