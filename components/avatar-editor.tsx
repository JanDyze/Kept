"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { restoreGooglePhoto } from "@/app/friends/actions";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

const SIDE = 400;

// The middle square of a photo, 400px, as a JPEG: a profile picture never needs more.
async function squareCrop(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIDE, side);
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.88));
}

// Your picture: change it (a photo from your phone), remove it (your initial shows), or go back to
// your Google account's.
export function AvatarEditor({
  name,
  username,
  current,
  google,
}: {
  name: string | null;
  username: string;
  current: string | null;
  google: string | null;
}) {
  const [src, setSrc] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const blob = await squareCrop(file).catch(() => {
        throw new Error("That file can't be read. Try a JPEG or PNG photo.");
      });
      const form = new FormData();
      form.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/avatars", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "The photo didn't upload. Try again.");
      setSrc(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The photo didn't upload. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const button = "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60";

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change photo"
        className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar name={name} username={username} src={src} eager className="size-20 text-3xl" />
        <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Camera className="size-3.5" aria-hidden />}
        </span>
      </button>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={button}>
          Change photo
        </button>
        <div className="flex flex-wrap gap-2">
          {google && src !== google && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                start(async () => {
                  const r = await restoreGooglePhoto();
                  if (r.url) setSrc(r.url);
                  else if (r.error) setError(r.error);
                })
              }
              className={cn(button, "px-3 text-xs")}
            >
              Use Google photo
            </button>
          )}
          {src && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setError(null);
                const res = await fetch("/api/avatars", { method: "DELETE" });
                if (res.ok) setSrc(null);
                else setError("The photo wasn't removed. Try again.");
              }}
              className={cn(button, "px-3 text-xs hover:text-destructive")}
            >
              Remove
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
