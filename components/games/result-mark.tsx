import { Check, Flag, Heart, Star, X } from "lucide-react";
import { scoreText, type GameScore } from "@/lib/games/summary";
import { cn } from "@/lib/utils";

// How a finished game went, drawn rather than written: a gold Perfect, a Solved chip with the
// mistakes as marks, guesses as a row of tiles, rounds as dots, lives as hearts. Colored in the
// game's own hue on its card (--game-strong), the brand color elsewhere.
export function ResultMark({ score, size = "sm", className }: { score: GameScore; size?: "sm" | "lg"; className?: string }) {
  const lg = size === "lg";
  const chip = cn(
    "inline-flex shrink-0 items-center rounded-full font-semibold",
    lg ? "h-10 gap-1.5 px-4 text-base" : "h-7 gap-1 px-2.5 text-[0.8125rem]",
  );
  const icon = lg ? "size-4.5" : "size-3.5";
  const solved = (
    <span className={cn(chip, "bg-(--mark)/14 text-(--mark)")}>
      <Check className={icon} strokeWidth={3} aria-hidden /> Solved
    </span>
  );
  const unsolved = (label: string) => (
    <span className={cn(chip, "bg-muted-foreground/12 text-muted-foreground")}>
      <X className={icon} strokeWidth={3} aria-hidden /> {label}
    </span>
  );

  let body: React.ReactNode;
  switch (score.kind) {
    case "perfect":
      body = (
        <span className={cn(chip, "bg-icon-accent text-[#2a1a04] shadow-[0_2px_10px_-3px] shadow-icon-accent/60")}>
          <Star className={cn(icon, "fill-current")} aria-hidden /> Perfect
        </span>
      );
      break;
    case "mistakes":
      body = (
        <>
          {solved}
          <Marks lg={lg}>
            {Array.from({ length: Math.min(score.count, 3) }, (_, i) => (
              <X key={i} className={cn(lg ? "size-5" : "size-4", "text-(--mark-miss)")} strokeWidth={3} aria-hidden />
            ))}
            {score.count > 3 && <span className="font-semibold text-(--mark-miss)">+{score.count - 3}</span>}
          </Marks>
        </>
      );
      break;
    case "tries":
      body = (
        <>
          {score.won ? solved : unsolved("Not solved")}
          <Marks lg={lg}>
            {Array.from({ length: score.max }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-[3px]",
                  lg ? "size-3.5" : "size-2.5",
                  i < score.used - (score.won ? 1 : 0)
                    ? "bg-muted-foreground/35"
                    : score.won && i === score.used - 1
                      ? "bg-(--mark)"
                      : "border-[1.5px] border-muted-foreground/30",
                )}
              />
            ))}
          </Marks>
        </>
      );
      break;
    case "score": {
      const right = score.right.filter(Boolean).length;
      body = (
        <>
          {right * 2 >= score.right.length ? solved : unsolved("Not solved")}
          <Marks lg={lg}>
            {score.right.map((ok, i) => (
              <span
                key={i}
                className={cn(
                  "flex items-center justify-center rounded-full",
                  lg ? "size-5" : "size-4",
                  ok ? "bg-(--mark) text-(--game-tile,var(--background))" : "bg-(--mark-miss) text-white",
                )}
              >
                {ok ? (
                  <Check className={lg ? "size-3" : "size-2.5"} strokeWidth={4} />
                ) : (
                  <X className={lg ? "size-3" : "size-2.5"} strokeWidth={4} />
                )}
              </span>
            ))}
          </Marks>
        </>
      );
      break;
    }
    case "lives":
      body = (
        <>
          {score.won ? solved : unsolved("Out of lives")}
          <Marks lg={lg}>
            {Array.from({ length: score.max }, (_, i) => (
              <Heart
                key={i}
                className={cn(
                  lg ? "size-5" : "size-4",
                  i < score.left ? "fill-(--mark-miss) text-(--mark-miss)" : "text-muted-foreground/35",
                )}
                aria-hidden
              />
            ))}
          </Marks>
        </>
      );
      break;
    case "gave_up":
      body = (
        <span className={cn(chip, "bg-muted-foreground/12 text-muted-foreground")}>
          <Flag className={icon} aria-hidden /> Gave up
        </span>
      );
      break;
  }

  return (
    <span
      role="img"
      aria-label={scoreText(score)}
      className={cn("inline-flex items-center [--mark:var(--game-strong,var(--primary))]", lg ? "gap-3" : "gap-2", className)}
    >
      {body}
    </span>
  );
}

function Marks({ lg, children }: { lg: boolean; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center", lg ? "gap-1.5 text-base" : "gap-1 text-sm")}>{children}</span>;
}
