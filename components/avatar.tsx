import { cn } from "@/lib/utils";

// A person's initial on a calm tint picked from their username, so it's the same everywhere.
const TINTS = ["#283d4e", "#073031", "#27402f", "#3d2b3e", "#8a4b32", "#5b4a2e", "#2f3f5c", "#4a3a2a"];

export function Avatar({ name, username, className }: { name: string | null; username: string; className?: string }) {
  const hash = [...username].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const initial = (name || username).trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-full font-brand text-base font-semibold text-white", className)}
      style={{ backgroundColor: TINTS[hash % TINTS.length] }}
    >
      {initial}
    </span>
  );
}
