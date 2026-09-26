import Link from "next/link";
import { LOOKUP_TRANSLATIONS, type LookupTranslation } from "@/lib/bible/translations";
import { cn } from "@/lib/utils";

// ESV | MBBTAG switch that keeps the current page (and any other query params) and swaps ?t=.
export function TranslationToggle({
  current,
  path,
  params,
}: {
  current: LookupTranslation;
  path: string;
  params?: Record<string, string>;
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1 text-sm" role="group" aria-label="Translation">
      {LOOKUP_TRANSLATIONS.map((t) => (
        <Link
          key={t}
          href={`${path}?${new URLSearchParams({ ...params, t })}`}
          replace
          scroll={false}
          aria-current={current === t ? "true" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors",
            current === t && "bg-background text-foreground shadow-sm",
          )}
        >
          {t}
        </Link>
      ))}
    </div>
  );
}

export function readTranslation(value: unknown): LookupTranslation {
  return value === "MBBTAG" ? "MBBTAG" : "ESV";
}
