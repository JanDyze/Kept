import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type BackLink = { href: string; label: string };

// Sticky top bar. Three layouts:
// - title: icon-only back arrow + page title and subtitle (e.g. "My verses", "6 verses")
// - back only: "‹ Label" link
// - neither: the Kept wordmark
// It keeps a fixed view-transition name so it stays put while pages slide underneath.
export function AppHeader({
  back,
  title,
  subtitle,
  children,
}: {
  back?: BackLink;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md"
    >
      <div className={cn("mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4", title ? "h-16" : "h-14")}>
        {title ? (
          <div className="flex min-w-0 items-center gap-1">
            {back && (
              <Link
                href={back.href}
                transitionTypes={["nav-back"]}
                aria-label={`Back to ${back.label}`}
                className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-brand text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        ) : back ? (
          <Link
            href={back.href}
            transitionTypes={["nav-back"]}
            className="-ml-2 flex h-11 min-w-0 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{back.label}</span>
          </Link>
        ) : (
          <Link href="/" transitionTypes={["nav-back"]} className="flex items-center gap-2">
            <Image src="/logo-animated.svg" alt="" width={30} height={30} unoptimized className="dark:brightness-0 dark:invert" />
            <span className="font-brand text-[1.6rem] font-semibold leading-none tracking-tight">Kept</span>
          </Link>
        )}
        {children}
      </div>
    </header>
  );
}
