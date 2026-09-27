"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { AlignCenter, AlignLeft, Check, ImagePlus, Loader2, Move, Trash2 } from "lucide-react";
import { saveCard } from "@/app/verses/[id]/card/actions";
import { cardFontClass, MemoryCard } from "@/components/memory-card";
import { TextCard, type LibraryItem } from "@/components/verse-library";
import { Button } from "@/components/ui/button";
import {
  CARD_COLORS,
  CARD_FONTS,
  cardColors,
  cardImageUrl,
  DEFAULT_CARD,
  IMAGE_DEFAULTS,
  type CardColor,
  type CardFont,
  type CardStyle,
  TEXT_COLORS,
  type TextColor,
} from "@/lib/cards/style";
import { cn } from "@/lib/utils";

type Tab = "background" | "text";
const MAX_SIDE = 1600;

// Shrinks a photo in the browser (and bakes in its rotation) before upload: phone photos are
// several MB, and a card never needs more than ~1600px.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.86),
  );
}

type Preview = "card" | "list";

export function CardEditor({
  item,
  saved,
  images: initialImages,
}: {
  item: Omit<LibraryItem, "card">; // the verse as My verses shows it
  saved: CardStyle | null;
  images: string[];
}) {
  const verseId = item.id;
  const reference = item.localReference ?? item.reference;
  const { translation, text } = item;
  const [preview, setPreview] = useState<Preview>("card");
  const [style, setStyle] = useState<CardStyle>(saved ?? DEFAULT_CARD);
  const [images, setImages] = useState(initialImages);
  const [tab, setTab] = useState<Tab>("background");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<CardStyle>) => setStyle((s) => ({ ...s, ...patch }));
  const bg = style.bg;
  const changed = !saved || JSON.stringify(saved) !== JSON.stringify(style);

  // Dragging the photo in the preview moves it; like panning, the photo follows the finger.
  const drag = useRef<{ x: number; y: number; focusX: number; focus: number; width: number; height: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (bg.kind !== "image") return;
    const box = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, focusX: bg.focusX, focus: bg.focus, width: box.width, height: box.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || bg.kind !== "image") return;
    const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
    set({
      bg: {
        ...bg,
        focusX: clamp(d.focusX - ((e.clientX - d.x) / d.width) * 160),
        focus: clamp(d.focus - ((e.clientY - d.y) / d.height) * 160),
      },
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  const pickImage = (id: string) =>
    set({ bg: bg.kind === "image" ? { ...bg, image: id } : { kind: "image", image: id, ...IMAGE_DEFAULTS } });

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await shrink(file).catch(() => {
        throw new Error("That file can't be read. Try a JPEG or PNG photo.");
      });
      const form = new FormData();
      form.append("file", blob, "photo.jpg");
      const res = await fetch("/api/card-images", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "The photo didn't upload. Try again.");
      setImages((list) => [data.id!, ...list]);
      pickImage(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The photo didn't upload. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(id: string) {
    if (!window.confirm("Delete this photo? Cards that use it go back to plain.")) return;
    setError(null);
    const res = await fetch(`/api/card-images/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) return setError("The photo wasn't deleted. Try again.");
    setImages((list) => list.filter((i) => i !== id));
    set({ bg: { kind: "theme" } });
  }

  const save = (value: CardStyle | null) =>
    startTransition(async () => {
      setError(null);
      const result = await saveCard(verseId, value);
      if (result?.error) setError(result.error);
    });

  return (
    <div className="flex flex-1 flex-col">
      {/* live preview, kept in view while the controls scroll: the card itself, or its tile in
          My verses (wide, so a photo crops differently there) */}
      <div className="sticky top-(--header-offset) z-10 transition-[top] duration-300 ease-out -mx-4 bg-background/90 px-4 pt-1 pb-4 backdrop-blur-md">
        <div role="radiogroup" aria-label="Preview" className="mx-auto mb-3 flex w-fit gap-1 rounded-full bg-muted p-1">
          {(["card", "list"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={preview === p}
              onClick={() => setPreview(p)}
              className={cn(
                "h-7 rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                preview === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "card" ? "Card" : "In the list"}
            </button>
          ))}
        </div>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            "relative mx-auto select-none",
            preview === "card" ? "max-w-[15rem]" : "max-w-xl",
            bg.kind === "image" && "cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          {preview === "card" ? (
            <MemoryCard style={style} reference={reference} translation={translation} text={text} morphId={verseId} />
          ) : (
            <TextCard v={{ ...item, card: style }} />
          )}
          {bg.kind === "image" && (
            <span
              className="pointer-events-none absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-hidden
            >
              <Move className="size-3.5" />
            </span>
          )}
        </div>
      </div>

      <Segmented
        label="Edit"
        value={tab}
        onChange={setTab}
        options={[
          { value: "background", label: "Background" },
          { value: "text", label: "Text" },
        ]}
      />

      {tab === "background" ? (
        <div className="animate-rise mt-6 flex flex-col gap-7">
          <Field label="Color">
            <div className="flex flex-wrap gap-3">
              <Swatch
                label="Theme"
                selected={bg.kind === "theme"}
                onClick={() => set({ bg: { kind: "theme" } })}
                className="border bg-card text-card-foreground"
              />
              {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
                <Swatch
                  key={c}
                  label={CARD_COLORS[c].name}
                  selected={bg.kind === "color" && bg.color === c}
                  onClick={() => set({ bg: { kind: "color", color: c } })}
                  style={{ backgroundColor: CARD_COLORS[c].bg, color: CARD_COLORS[c].fg }}
                />
              ))}
            </div>
          </Field>

          <Field label="Photo">
            <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                aria-label="Add a photo"
                className="flex size-18 shrink-0 items-center justify-center rounded-2xl border border-dashed border-foreground/25 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-6" aria-hidden />}
              </button>
              {images.map((id) => {
                const selected = bg.kind === "image" && bg.image === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickImage(id)}
                    aria-pressed={selected}
                    aria-label="Use this photo"
                    className={cn(
                      "relative size-18 shrink-0 overflow-hidden rounded-2xl ring-offset-2 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      selected && "ring-2 ring-primary",
                    )}
                  >
                    <Image src={cardImageUrl(id)} alt="" fill unoptimized sizes="72px" className="object-cover" />
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                        <Check className="size-5" aria-hidden />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <input
              ref={fileInput}
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
          </Field>

          {bg.kind === "image" && (
            <div className="animate-rise flex flex-col gap-5 rounded-2xl border bg-card p-4">
              <Slider label="Dim" value={bg.dim} max={85} unit="%" onChange={(dim) => set({ bg: { ...bg, dim } })} />
              <Slider label="Blur" value={bg.blur} max={20} onChange={(blur) => set({ bg: { ...bg, blur } })} />
              <Slider
                label="Zoom"
                value={bg.zoom}
                min={100}
                max={300}
                format={(v) => `${(v / 100).toFixed(1)}×`}
                onChange={(zoom) => set({ bg: { ...bg, zoom } })}
              />
              {(bg.focusX !== 50 || bg.focus !== 50) && (
                <button
                  type="button"
                  onClick={() => set({ bg: { ...bg, focusX: 50, focus: 50 } })}
                  className="-my-1 self-start text-sm text-muted-foreground hover:text-foreground"
                >
                  Center photo
                </button>
              )}
              <button
                type="button"
                onClick={() => void removeImage(bg.image)}
                className="-mb-1 inline-flex h-9 items-center gap-1.5 self-start rounded-lg text-sm text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden /> Delete photo
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span id="grain-label" className="font-medium">
              Paper grain
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={style.grain}
              aria-labelledby="grain-label"
              onClick={() => set({ grain: !style.grain })}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                style.grain ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 size-5 rounded-full bg-background shadow-sm transition-transform duration-200",
                  style.grain && "translate-x-5",
                )}
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-rise mt-6 flex flex-col gap-7">
          <Field label="Font">
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(CARD_FONTS) as CardFont[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={style.font === f}
                  onClick={() => set({ font: f })}
                  className={cn(
                    "flex h-18 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    style.font === f ? "border-primary bg-primary/8 text-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className={cn("text-2xl leading-none text-foreground", cardFontClass(f))}>Aa</span>
                  <span className="text-xs">{CARD_FONTS[f].name}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-3">
              <Swatch
                label="Auto"
                selected={style.text === "auto"}
                onClick={() => set({ text: "auto" })}
                className={cn("font-brand text-base font-semibold", style.bg.kind === "theme" && "border bg-card")}
                style={{ backgroundColor: cardColors(style.bg).bg, color: cardColors(style.bg).fg }}
              >
                A
              </Swatch>
              {(Object.keys(TEXT_COLORS) as TextColor[]).map((c) => (
                <Swatch
                  key={c}
                  label={TEXT_COLORS[c].name}
                  selected={style.text === c}
                  onClick={() => set({ text: c })}
                  style={{ backgroundColor: TEXT_COLORS[c].color, color: c === "ink" || c === "black" ? "#fff" : "#111" }}
                />
              ))}
            </div>
          </Field>
          <Field label="Size">
            <Segmented
              label="Size"
              value={style.size}
              onChange={(size) => set({ size })}
              options={[
                { value: "s", label: "Small" },
                { value: "m", label: "Medium" },
                { value: "l", label: "Large" },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Align">
              <Segmented
                label="Align"
                value={style.align}
                onChange={(align) => set({ align })}
                options={[
                  { value: "left", label: <AlignLeft className="size-4" aria-label="Left" /> },
                  { value: "center", label: <AlignCenter className="size-4" aria-label="Center" /> },
                ]}
              />
            </Field>
            <Field label="Reference">
              <Segmented
                label="Reference"
                value={style.reference}
                onChange={(reference) => set({ reference })}
                options={[
                  { value: "top", label: "Top" },
                  { value: "bottom", label: "Bottom" },
                ]}
              />
            </Field>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-auto bg-background/90 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        {error && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className={cn("grid gap-2", saved && "grid-cols-[auto_1fr]")}>
          {saved && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => save(null)}
              className="h-12 px-4 text-base"
            >
              Plain page
            </Button>
          )}
          <Button
            type="button"
            disabled={pending || uploading || !changed}
            aria-busy={pending}
            onClick={() => save(style)}
            className="h-12 gap-2 text-base"
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save card
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Swatch({
  label,
  selected,
  onClick,
  className,
  style,
  children,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      style={style}
      className={cn(
        "flex size-10 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(128_128_128/0.3)] ring-offset-2 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "ring-2 ring-primary",
        className,
      )}
    >
      {selected && !children ? <Check className="size-4" aria-hidden /> : children}
    </button>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-muted p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === o.value
              ? "bg-background text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min = 0,
  max,
  unit = "",
  format,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{format ? format(value) : `${value}${unit}`}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full cursor-pointer accent-primary"
      />
    </label>
  );
}
