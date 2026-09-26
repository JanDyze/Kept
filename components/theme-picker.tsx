"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { ThemeEmblem, ThemeScope, themes, useTheme, type ThemeInfo } from "goodthemes";
import { cn } from "@/lib/utils";

const noop = () => () => {};

// Each tile names its theme in the theme's display face. One small request covers all of them:
// Google Fonts subsets to just the letters of the names.
const NAMES_FONT_HREF = (() => {
  const all = Object.values(themes);
  const families = all.map(({ fonts }) => {
    const family = fonts.display.replaceAll(" ", "+");
    return new RegExp(`family=${family}(?::[^&]*)?`).exec(fonts.href)?.[0] ?? `family=${family}`;
  });
  const letters = [...new Set(all.map((t) => t.name).join(""))].join("");
  return `https://fonts.googleapis.com/css2?${families.join("&")}&text=${encodeURIComponent(letters)}&display=swap`;
})();

export function ThemePicker() {
  const { theme, info, ambient, setTheme, setAmbient, preload } = useTheme();
  // The saved theme is only known in the browser; render neutral on the server to avoid a mismatch.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const current = mounted ? theme : undefined;

  return (
    <>
      <link rel="stylesheet" href={NAMES_FONT_HREF} precedence="default" />
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
        <Tile selected={current === null} label="Kept" onClick={(e) => setTheme(null, e)}>
          <span className="flex size-full flex-col items-center justify-center gap-2 rounded-[1.125rem] border border-black/10 bg-white text-[#283D4E] dark:border-white/10 dark:bg-[oklch(0.205_0.017_250)] dark:text-[oklch(0.96_0.006_250)]">
            <Image src="/logo.svg" alt="" width={34} height={34} unoptimized className="dark:brightness-0 dark:invert" />
            <span className="text-[15px] font-semibold leading-none" style={{ fontFamily: "var(--font-brand)" }}>
              Kept
            </span>
          </span>
        </Tile>
        {Object.values(themes).map((t) => (
          <Tile
            key={t.id}
            selected={current === t.id}
            label={t.name}
            onClick={(e) => setTheme(t.id, e)}
            onPointerEnter={() => preload(t.id)}
          >
            <ThemeScope theme={t.id} fonts={false} className="flex size-full flex-col items-center justify-center gap-2 rounded-[1.125rem] border">
              <ThemeEmblem theme={t.id} size={34} className="text-primary" animate="hover" />
              <ThemeName theme={t} />
            </ThemeScope>
          </Tile>
        ))}
      </div>

      {mounted && info && (
        <div className="mt-3 divide-y rounded-2xl border bg-card">
          <figure className="px-4 py-3.5">
            <blockquote className="font-serif text-[15px] leading-relaxed">{info.inspiration.verse}</blockquote>
            <figcaption className="mt-1.5 text-xs text-muted-foreground">
              {info.inspiration.reference} · {info.inspiration.translation}
            </figcaption>
          </figure>
          <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5">
            <span className="font-medium">Moving scenery</span>
            <Switch checked={ambient} onChange={setAmbient} />
          </label>
        </div>
      )}
    </>
  );
}

function Tile({
  selected,
  label,
  children,
  ...props
}: {
  selected: boolean;
  label: string;
  children: React.ReactNode;
} & Pick<React.ComponentProps<"button">, "onClick" | "onPointerEnter">) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={cn(
        "group relative aspect-[5/4] overflow-hidden rounded-[1.125rem] outline-offset-2 transition-transform active:scale-[0.97]",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      {...props}
    >
      {children}
      {selected && (
        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      )}
    </button>
  );
}

function ThemeName({ theme }: { theme: ThemeInfo }) {
  return (
    <span
      className="text-[15px] leading-none"
      style={{
        fontFamily: `"${theme.fonts.display}", var(--gt-font-body)`,
        fontWeight: "var(--gt-display-weight)",
        fontStyle: "var(--gt-display-style, normal)",
        letterSpacing: "var(--gt-display-tracking)",
      }}
    >
      {theme.name}
    </span>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-5 rounded-full bg-background shadow-sm transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
