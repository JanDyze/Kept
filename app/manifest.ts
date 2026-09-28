import type { MetadataRoute } from "next";

// Kept as an installable app: its own window, the navy mark on the home screen, and shortcuts on a
// long press of the icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kept",
    short_name: "Kept",
    description: "Memorize Scripture with spaced repetition.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#283D4E",
    theme_color: "#283D4E",
    categories: ["education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/kept.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Games", url: "/games", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My verses", url: "/verses", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Discover", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Add a verse", url: "/verses/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
