"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ANIMATED_LOGO_SVG } from "@/components/animated-logo-markup";
import { cn } from "@/lib/utils";

const DELAY_MS = 1000; // only show when a page is genuinely slow
// While waiting, the logo weaves in once (~2.6s), then the finished mark turns slowly for a
// while, and only then weaves again: calm, not a loop of the whole drawing.
const WEAVE_MS = 2800;
const SPIN_MS = 7200; // three turns of .animate-logo-spin
const GIVE_UP_MS = 20000; // never leave the overlay stuck if a navigation silently fails

export type OverlayVerse = { reference: string; translation: string; text: string };

// Always in the rotation: the verse the app is named for.
export const PSALM_119_11: OverlayVerse = {
  reference: "Psalm 119:11",
  translation: "ESV",
  text: "I have stored up your word in my heart, that I might not sin against you.",
};

// Instead of flashing skeletons, the current page stays until the next one is ready (then the
// view transition slides it in). If that takes longer than a second, the animated logo covers
// the screen. Pending starts on an internal link tap or GET form submit, and ends when the URL
// actually changes.
// verses: your saved verses plus Psalm 119:11; one is picked at random each time it shows.
export function NavigationOverlay({ verses = [PSALM_119_11] }: { verses?: OverlayVerse[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Each navigation gets an id, and the overlay shows only while the navigation its timer was
  // started for is still pending. The show timer can fire after the page has already arrived
  // (React commits inside the view transition, so the cleanup can land late); it must not
  // bring the overlay back over a finished page.
  const nextId = useRef(0);
  const [pending, setPending] = useState<number | null>(null);
  const [shownFor, setShownFor] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [verse, setVerse] = useState(0);
  const url = `${pathname}?${searchParams}`;
  const visible = pending !== null && shownFor === pending;

  // Arrived: the rendered URL changed (the new page has committed), so stop waiting.
  const [renderedUrl, setRenderedUrl] = useState(url);
  if (url !== renderedUrl) {
    setRenderedUrl(url);
    setPending(null);
  }

  useEffect(() => {
    const current = () => `${window.location.pathname}?${new URLSearchParams(window.location.search)}`;
    const start = (target: URL) => {
      if (target.origin !== window.location.origin) return;
      if (`${target.pathname}?${target.searchParams}` === current()) return; // same page or #hash only
      setPending(++nextId.current);
      setSpinning(false); // each wait starts with the logo weaving in
      setVerse(Math.floor(Math.random() * verses.length));
    };
    // Capture phase: Next's <Link> calls preventDefault in its own handler, so listen before it.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.hasAttribute("download")) return;
      start(new URL(a.href));
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.method.toLowerCase() !== "get") return;
      const target = new URL(form.action);
      target.search = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
      // Forms handled in place (a game's guess) cancel the submit after this capture listener runs.
      setTimeout(() => {
        if (!e.defaultPrevented) start(target);
      });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [verses.length]);

  useEffect(() => {
    if (pending === null) return;
    const show = setTimeout(() => setShownFor(pending), DELAY_MS);
    const giveUp = setTimeout(() => setPending((p) => (p === pending ? null : p)), GIVE_UP_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
    };
  }, [pending]);

  useEffect(() => {
    if (!visible) return;
    // weave → spin → weave again (a new cycle remounts the logo, replaying its drawing)
    const next = setTimeout(
      () => {
        if (spinning) setCycle((c) => c + 1);
        setSpinning((s) => !s);
      },
      spinning ? SPIN_MS : WEAVE_MS,
    );
    return () => clearTimeout(next);
  }, [visible, spinning]);

  if (!visible) return null;
  const shown = verses[verse] ?? PSALM_119_11;
  return (
    <div
      role="status"
      aria-label="Loading"
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm"
    >
      <div className="flex max-w-xs flex-col items-center px-6 text-center">
        {/* Inline, so it needs no download on a slow connection; remounting (key) replays the weave. */}
        <div
          key={cycle}
          className={cn("size-[88px] dark:brightness-0 dark:invert", spinning && "animate-logo-spin")}
          dangerouslySetInnerHTML={{ __html: ANIMATED_LOGO_SVG }}
        />
        <figure className="animate-rise mt-6" style={{ animationDelay: "400ms" }}>
          <blockquote className="line-clamp-6 font-serif text-lg leading-relaxed text-foreground/85">
            &ldquo;{shown.text}&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-sm text-muted-foreground">
            {shown.reference} · {shown.translation}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
