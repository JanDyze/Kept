export function formatDate(d: Date) {
  return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}
