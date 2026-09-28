"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Check, Copy, Download, Link2, Loader2, Share, Share2 } from "lucide-react";
import { shareCard, unshareCard } from "@/app/verses/[id]/share-actions";
import { cn } from "@/lib/utils";

const noSubscription = () => () => {};
const canShareFiles = () =>
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [new File([""], "card.png", { type: "image/png" })] });

// The card as a sharp PNG (3× its on-screen size), drawn from the page itself, so it matches
// exactly: fonts, photo, grain, border.
async function renderCard(verseId: string) {
  // The wrapper, not the card inside it: the card sizes itself in container units against it.
  const el = document.querySelector<HTMLElement>(`[data-card="${verseId}"]`);
  if (!el) throw new Error("no card");
  const { domToBlob } = await import("modern-screenshot");
  const blob = await domToBlob(el, { scale: 3, type: "image/png", fetch: { requestInit: { credentials: "same-origin" } } });
  if (!blob) throw new Error("no image");
  return blob;
}

const fileName = (reference: string) => `${reference.replace(/[^\p{L}\p{N} -]+/gu, "-").trim()}.png`;

// Sharing a verse: its card as an image (to save, or hand to another app), and a public link
// anyone can open, which can be turned off again.
export function CardShare({
  verseId,
  reference,
  hasCard,
  initialPath,
}: {
  verseId: string;
  reference: string;
  hasCard: boolean;
  initialPath: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(initialPath);
  const [busy, setBusy] = useState<"image" | "link" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const shareFiles = useSyncExternalStore(noSubscription, canShareFiles, () => false);
  const url = path ? `${typeof location === "undefined" ? "" : location.origin}${path}` : null;

  async function image(mode: "share" | "save") {
    setBusy("image");
    setError(null);
    try {
      const blob = await renderCard(verseId);
      const file = new File([blob], fileName(reference), { type: "image/png" });
      if (mode === "share") {
        await navigator.share({ files: [file], title: reference }).catch((e: unknown) => {
          if (!(e instanceof DOMException && e.name === "AbortError")) throw e;
        });
      } else {
        const href = URL.createObjectURL(file);
        const a = Object.assign(document.createElement("a"), { href, download: file.name });
        a.click();
        setTimeout(() => URL.revokeObjectURL(href), 10_000);
      }
    } catch {
      setError("The image couldn't be made. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function makeLink() {
    setBusy("link");
    setError(null);
    startTransition(async () => {
      const result = await shareCard(verseId);
      setBusy(null);
      if ("error" in result) setError(result.error);
      else setPath(result.path);
    });
  }

  function stopLink() {
    if (!window.confirm("Stop sharing? The link will stop working.")) return;
    const was = path;
    setPath(null);
    startTransition(async () => {
      try {
        await unshareCard(verseId);
      } catch {
        setPath(was);
        setError("Sharing couldn't be turned off. Try again.");
      }
    });
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const row =
    "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="card-share"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
          open ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Share className="size-4" aria-hidden /> Share
        {path && !open && <span className="size-1.5 rounded-full bg-primary" aria-label="Shared publicly" />}
      </button>

      {open && (
        <div id="card-share" className="animate-rise w-full rounded-2xl border bg-card p-1.5">
          {hasCard && (
            <>
              {shareFiles && (
                <button type="button" disabled={busy !== null} onClick={() => void image("share")} className={row}>
                  {busy === "image" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
                  Share image
                </button>
              )}
              <button type="button" disabled={busy !== null} onClick={() => void image("save")} className={row}>
                {busy === "image" && !shareFiles ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                Save image
              </button>
              <div className="mx-3 my-1 border-t" />
            </>
          )}

          {url ? (
            <div className="flex flex-col gap-1 p-1.5">
              <p className="flex items-center gap-2 px-1.5 text-xs text-muted-foreground">
                <Link2 className="size-3.5" aria-hidden /> Anyone with the link can see this card
              </p>
              <div className="flex items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">{url}</span>
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                >
                  {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  {copied ? "Copied" : "Copy"}
                </button>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    type="button"
                    onClick={() => void navigator.share({ url, title: reference }).catch(() => {})}
                    aria-label="Share link"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
                  >
                    <Share2 className="size-4" aria-hidden />
                  </button>
                )}
              </div>
              <button type="button" onClick={stopLink} className="self-start px-1.5 py-1.5 text-sm text-muted-foreground hover:text-destructive">
                Stop sharing
              </button>
            </div>
          ) : (
            <button type="button" disabled={busy !== null} onClick={makeLink} className={row}>
              {busy === "link" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
              Create a public link
            </button>
          )}

          {error && (
            <p role="alert" className="px-3 pb-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
