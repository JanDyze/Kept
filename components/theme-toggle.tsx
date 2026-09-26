"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "goodthemes";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

const noop = () => () => {};

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  // The saved mode is only known in the browser; render neutral on the server to avoid a mismatch.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const current = mounted ? mode : null;

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          onClick={(e) => setMode(value, e)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-all",
            current === value && "bg-background text-foreground shadow-sm",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
