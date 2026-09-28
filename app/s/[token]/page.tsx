import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoryCard } from "@/components/memory-card";
import { bookByName } from "@/lib/bible/books";
import { getSharedCard } from "@/lib/cards/share";
import { DEFAULT_CARD, type CardStyle } from "@/lib/cards/style";
import { cn } from "@/lib/utils";

// A card someone shared: just the card, for anyone with the link. No sign-in, nothing else of theirs.

const PLAIN: CardStyle = { ...DEFAULT_CARD, bg: { kind: "theme" } };

async function load(params: Promise<{ token: string }>) {
  const { token } = await params;
  const shared = await getSharedCard(token);
  if (!shared) notFound();
  const tl = shared.translation === "MBBTAG" ? bookByName(shared.book)?.tl : undefined;
  return { token, shared, reference: tl ? shared.reference.replace(shared.book, tl) : shared.reference };
}

export async function generateMetadata({ params }: PageProps<"/s/[token]">): Promise<Metadata> {
  const { shared, reference } = await load(params);
  const description = shared.text.length > 180 ? `${shared.text.slice(0, 177).trimEnd()}…` : shared.text;
  return {
    title: reference,
    description,
    openGraph: { title: `${reference} · ${shared.translation}`, description },
    robots: { index: false, follow: false },
  };
}

export default async function SharedCardPage({ params }: PageProps<"/s/[token]">) {
  const { token, shared, reference } = await load(params);
  const style = shared.style ?? PLAIN;
  return (
    <main className="mx-auto flex min-h-dvh w-full flex-col items-center justify-center gap-7 px-4 py-10">
      <MemoryCard
        style={style}
        reference={reference}
        translation={shared.translation}
        text={shared.text}
        imageSrc={`/s/${token}/photo`}
        className={cn(
          "animate-rise",
          style.shape === "landscape" ? "max-w-xl" : style.shape === "square" ? "max-w-md" : "max-w-sm",
        )}
      />
      <Link href="/" className="font-brand text-sm text-muted-foreground hover:text-foreground">
        Kept · verses kept by heart
      </Link>
    </main>
  );
}
