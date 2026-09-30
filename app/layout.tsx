import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
import { ThemeScript } from "goodthemes/script";
import { GuestPromptHost } from "@/components/guest-prompt";
import { ConfirmHost } from "@/components/confirm";
import { ActivityPing } from "@/components/activity-ping";
import { AppFeel } from "@/components/app-feel";
import { NavHistory } from "@/components/nav-history";
import { NavigationOverlayWithVerses } from "@/components/navigation-overlay-verses";
import { InstallBanner } from "@/components/install-banner";
import { ServiceWorker } from "@/components/service-worker";
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
  applicationName: "Kept",
  // Added to an iPhone's home screen, Kept opens in its own window like an app.
  appleWebApp: { capable: true, title: "Kept", statusBarStyle: "default" },
  // The tab icon is listed here too: with `icons` set, app/icon.svg wasn't linked on its own. The
  // PNG is for browsers that don't show SVG tab icons.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#283D4E" },
    { media: "(prefers-color-scheme: dark)", color: "#141b24" },
  ],
  // Installed, the app draws under the notch and home bar; bars pad themselves with safe-area insets.
  viewportFit: "cover",
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
          <ActivityPing />
          <AppFeel />
          <NavHistory />
          <ServiceWorker />
          <InstallBanner />
          <GuestPromptHost />
          <ConfirmHost />
          <Suspense fallback={null}>
            <NavigationOverlayWithVerses />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
