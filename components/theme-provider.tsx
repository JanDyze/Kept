"use client";

import { useEffect } from "react";
import { ThemeProvider as GoodThemes, useTheme } from "goodthemes";
import { THEME_OPTIONS } from "@/lib/theme";

// Light, dark, or follow the phone, plus an optional goodthemes theme (Eden, Exile, ...).
// <ThemeScript> in the layout applies the saved choice before paint, so there is no flash.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoodThemes {...THEME_OPTIONS}>
      <StatusBarColor />
      {children}
    </GoodThemes>
  );
}

// The phone's status bar follows the theme's background. Kept's own look keeps the colors
// set in the layout's viewport.
function StatusBarColor() {
  const { theme, resolvedMode } = useTheme();

  useEffect(() => {
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    for (const meta of metas) meta.dataset.original ??= meta.content;
    if (!theme) {
      for (const meta of metas) meta.content = meta.dataset.original!;
      return;
    }
    const color = toRgb(getComputedStyle(document.body).backgroundColor);
    for (const meta of metas) meta.content = color;
  }, [theme, resolvedMode]);

  return null;
}

// Themes are written in oklch, which not every browser takes for theme-color: paint it and read it back.
function toRgb(color: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return color;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}
