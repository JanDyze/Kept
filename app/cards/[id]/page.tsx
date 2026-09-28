import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/avatar";
import { KeepCardButton } from "@/components/keep-card-button";
import { MemoryCard } from "@/components/memory-card";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { galleryCard } from "@/lib/social/gallery";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Card" };

// A card from the gallery: the card itself, who made it, and keeping it for yourself.
export default async function CardPage({ params }: PageProps<"/cards/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireUser();
  const found = await galleryCard(user.id, id);
  if (!found) notFound();
  const { row, style, author, isOwner, reference } = found;

  return (
    <Screen back={{ href: "/search", label: "Discover" }} className="pb-0">
      <MemoryCard
        style={style}
        reference={reference}
        translation={row.translation}
        text={row.text}
        morphId={row.id}
        className={cn("mx-auto", style.shape === "landscape" ? "max-w-xl" : style.shape === "square" ? "max-w-md" : "max-w-sm")}
      />

      <Link
        href={`/u/${author.username}`}
        transitionTypes={["nav-forward"]}
        className="mt-5 flex items-center gap-3 rounded-2xl px-1 py-1.5 hover:bg-muted/50"
      >
        <Avatar name={author.displayName} username={author.username} src={author.avatarUrl} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{author.displayName ?? `@${author.username}`}</span>
          {author.displayName && <span className="block truncate text-sm text-muted-foreground">@{author.username}</span>}
        </span>
      </Link>

      <div className="sticky bottom-0 -mx-4 mt-auto bg-background/90 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        {isOwner ? (
          <Link
            href={`/verses/${row.id}`}
            transitionTypes={["nav-forward"]}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border text-base font-medium hover:bg-muted"
          >
            Your verse
          </Link>
        ) : (
          <KeepCardButton verseId={row.id} />
        )}
      </div>
    </Screen>
  );
}
