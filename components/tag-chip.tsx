import { BackNavLink } from "@/components/back-link";
import { Hash, X } from "lucide-react";
import { tagLabel } from "@/lib/verses/tag-label";
import { cn } from "@/lib/utils";

// A tag, set as a hashtag in the brand tint: a link to the verses that share it, or (with onRemove)
// a chip in the editor that can be taken off.
export function TagChip({
  tag,
  href,
  onRemove,
  className,
}: {
  tag: string;
  href?: string;
  onRemove?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <Hash className="size-3.5 opacity-60" aria-hidden />
      {tagLabel(tag)}
    </>
  );
  const chip = cn(
    "inline-flex h-8 items-center gap-0.5 rounded-lg bg-primary/8 pl-2 text-sm font-medium text-primary dark:bg-primary/15",
    onRemove ? "pr-1" : "pr-2.5",
    className,
  );
  if (href)
    return (
      // Up to My verses (filtered), like the back arrow: no new entry for the phone's Back.
      <BackNavLink href={href} transitionTypes={["nav-back"]} className={cn(chip, "transition-colors hover:bg-primary/15")}>
        {body}
      </BackNavLink>
    );
  return (
    <span className={chip}>
      {body}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${tagLabel(tag)}`}
          className="ml-0.5 flex size-6 items-center justify-center rounded-md text-primary/60 hover:bg-primary/15 hover:text-primary"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </span>
  );
}
