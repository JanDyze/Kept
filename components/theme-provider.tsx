"use client";

import { ThemeProvider as NextThemes } from "next-themes";

// Light, dark, or follow the phone. Adds the `dark` class to <html> before paint, so no flash.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
