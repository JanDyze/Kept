"use client";

import { useState, useTransition } from "react";
import { setVerseReaction } from "@/app/verses/actions";
import { HoldReact } from "@/components/hold-react";
import { isReaction, type Reaction } from "@/lib/reactions";

// One of your own verses, held to react to it (how it speaks to you); the reaction sits on its corner.
export function VerseReact({
  verseId,
  reaction,
  className,
  children,
}: {
  verseId: string;
  reaction: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<Reaction | null>(isReaction(reaction) ? reaction : null);
  const [, startTransition] = useTransition();
  return (
    <HoldReact
      reaction={current}
      className={className}
      onReact={(r) => {
        const was = current;
        setCurrent(r);
        startTransition(async () => {
          // Offline or failed: put it back rather than break the page.
          const result = await setVerseReaction(verseId, r).catch(() => ({ error: "offline" }));
          if (result.error) setCurrent(was);
        });
      }}
    >
      {children}
    </HoldReact>
  );
}
