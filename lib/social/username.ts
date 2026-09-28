// Usernames: 3–20 characters, lowercase letters, digits, "_" and ".", starting with a letter or
// digit. Shown as @name. Pure functions, shared by the server and the settings form.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const FORMAT = /^[a-z0-9][a-z0-9_.]{2,19}$/;

// Words that would read as the app itself or clash with its pages.
const RESERVED = new Set([
  "admin", "api", "app", "auth", "bible", "discover", "friends", "games", "help", "kept", "login",
  "me", "new", "root", "s", "search", "settings", "signup", "support", "system", "u", "verses",
]);

export function normalizeUsername(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

// Why a username can't be used, or null when it can.
export function usernameProblem(username: string): string | null {
  if (username.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
  if (username.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
  if (!FORMAT.test(username)) return "Use letters, numbers, _ and . only, starting with a letter or number.";
  if (RESERVED.has(username)) return "That name is taken.";
  return null;
}

// A first username from someone's name or email ("Ana Reyes" or ana.reyes@x → "anareyes").
export function suggestUsername(name: string | null, email: string | null) {
  const from = name || email?.split("@")[0] || "";
  let base = from
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, 16);
  if (base.length < USERNAME_MIN || RESERVED.has(base)) base = `${base || "friend"}kept`.slice(0, 16);
  return base;
}
