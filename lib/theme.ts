// Shared by <ThemeScript> (server, before paint) and <ThemeProvider> (client), which must agree.
// No theme by default: Kept's own navy look, until someone picks one in Settings.
export const THEME_OPTIONS = {
  storageKey: "kept-appearance",
  defaultTheme: null,
  defaultMode: "system",
} as const;
