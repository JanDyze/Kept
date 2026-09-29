import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/avatar";
import { CardSwiper } from "@/components/card-swiper";
import { KeepCardButton } from "@/components/keep-card-button";
import { LikeButton } from "@/components/like-button";
import { MemoryCard } from "@/components/memory-card";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { cardNeighbours } from "@/lib/social/card-list";
import { galleryCard } from "@/lib/social/gallery";
import { cardLikeInfo } from "@/lib/social/likes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Card" };

// A card from the gallery: the card itself, who made it, liking and keeping it. Opened from a list
// (?from=…), it swipes to the cards either side.
export default async function CardPage({ params, searchParams }: PageProps<"/cards/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const fromParam = (await searchParams).from;
  const from = typeof fromParam === "string" ? fromParam : undefined;
  const user = await requireUser();
  const [found, around, likes] = await Promise.all([
    galleryCard(user.id, id),
    cardNeighbours(user.id, from, id),
    cardLikeInfo(user.id, [id]),
  ]);
  if (!found) notFound();
  const { row, style, author, isOwner, reference } = found;
  const like = likes.get(id) ?? { count: 0, liked: false };
  const href = (to: string | null | undefined) => (to ? `/cards/${to}?from=${encodeURIComponent(from!)}` : null);
  const back = from?.startsWith("u:")
    ? { href: `/u/${from.slice(2)}${author.userId === user.id ? "?tab=shared" : ""}`, label: "Profile" }
    : { href: from === "friends" ? "/search?who=friends" : "/search", label: "Discover" };

  return (
    <Screen back={back} className="pb-0">
      <CardSwiper key={id} className="flex flex-1 flex-col" prevHref={href(around?.prev)} nextHref={href(around?.next)}>
        <MemoryCard
          style={style}
          reference={reference}
          translation={row.translation}
          text={row.text}
          morphId={row.id}
          className={cn("mx-auto", style.shape === "landscape" ? "max-w-xl" : style.shape === "square" ? "max-w-md" : "max-w-sm")}
        />

      <div className="mt-5 flex items-center gap-2">
        <Link
          href={`/u/${author.username}`}
          transitionTypes={["nav-forward"]}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 py-1.5 hover:bg-muted/50"
        >
          <Avatar name={author.displayName} username={author.username} src={author.avatarUrl} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{author.displayName ?? `@${author.username}`}</span>
            {author.displayName && <span className="block truncate text-sm text-muted-foreground">@{author.username}</span>}
          </span>
        </Link>
        {isOwner ? (
          like.count > 0 && (
            <span className="shrink-0 px-3 text-sm text-muted-foreground tabular-nums">
              {like.count} {like.count === 1 ? "like" : "likes"}
            </span>
          )
        ) : (
          <LikeButton target={{ card: id }} likes={like.count} liked={like.liked} className="border" />
        )}
      </div>

      {around && around.total > 1 && (
        <p className="mt-3 text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {around.index + 1} of {around.total}
        </p>
      )}

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
      </CardSwiper>
    </Screen>
  );
}
