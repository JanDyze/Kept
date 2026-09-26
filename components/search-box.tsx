import Form from "next/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Plain GET form to /search, so it works without JavaScript and results are linkable.
export function SearchBox({
  defaultValue,
  translation,
  autoFocus,
  className,
}: {
  defaultValue?: string;
  translation?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <Form action="/search" role="search" className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        enterKeyHint="search"
        autoComplete="off"
        aria-label="Search verses"
        placeholder="Search a feeling, an occasion, or words"
        className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-base outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />
      {translation && <input type="hidden" name="t" value={translation} />}
    </Form>
  );
}
