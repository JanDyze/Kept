import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
import { ThemeScript } from "goodthemes/script";
import { AppFeel } from "@/components/app-feel";
import { NavigationOverlayWithVerses } from "@/components/navigation-overlay-verses";
import { ThemeProvider } from "@/components/theme-provider";
import { TimezoneSync } from "@/components/timezone-sync";
import { THEME_MIGRATION, THEME_OPTIONS } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Verse text is set in a serif for calm, book-like reading.
const scripture = Source_Serif_4({
  variable: "--font-scripture",
  subsets: ["latin", "latin-ext"],
});

// Display face for the "Kept" wordmark and big headings.
const brand = Fraunces({
  variable: "--font-brand",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: { default: "Kept", template: "%s · Kept" },
  description: "Memorize Scripture with spaced repetition.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#283D4E" },
    { media: "(prefers-color-scheme: dark)", color: "#141b24" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${scripture.variable} ${brand.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_MIGRATION }} />
        <ThemeScript {...THEME_OPTIONS} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TimezoneSync />
          <AppFeel />
          <Suspense fallback={null}>
            <NavigationOverlayWithVerses />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
