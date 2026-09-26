// Shared by <ThemeScript> (server, before paint) and <ThemeProvider> (client), which must agree.
// No theme by default: Kept's own navy look, until someone picks one in Settings.
export const THEME_OPTIONS = {
  storageKey: "kept-appearance",
  defaultTheme: null,
  defaultMode: "system",
} as const;

// goodthemes 0.2 renamed nine themes. Runs in <head> before <ThemeScript>, so a theme saved under
// its old id carries over instead of falling back to Kept's own look.
const RENAMED: Record<string, string> = {
  eden: "first-garden",
  babel: "unfinished-tower",
  jericho: "fallen-walls",
  cana: "good-wine",
  galilee: "fishers-of-men",
  zion: "pearl-gates",
  pentecost: "mighty-wind",
  deluge: "great-flood",
  "big-fish": "swallowed",
};

export const THEME_MIGRATION = `try{var k=${JSON.stringify(THEME_OPTIONS.storageKey)},m=${JSON.stringify(RENAMED)},s=JSON.parse(localStorage.getItem(k)||"null");if(s&&m[s.theme]){s.theme=m[s.theme];localStorage.setItem(k,JSON.stringify(s))}}catch(e){}`;
