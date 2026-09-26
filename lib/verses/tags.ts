// Lowercase, trimmed, de-duplicated. Accepts a comma-separated string or a list.
export function normalizeTags(raw: string | string[]): string[] {
  const parts = Array.isArray(raw) ? raw : raw.split(",");
  const tags = parts.map((t) => t.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, " ")).filter(Boolean);
  return [...new Set(tags)].slice(0, 20).map((t) => t.slice(0, 30));
}
