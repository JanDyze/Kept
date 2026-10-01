import Link from "next/link";
import { Heart } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CardReact, LikeButton } from "@/components/like-button";
import { MemoryCard } from "@/components/memory-card";
import type { GalleryCard } from "@/lib/social/gallery";

// Cards in a masonry grid (two columns on a phone, three wider): portrait, square and landscape
// cards stack at their own heights, Pinterest-style. Each opens its page, morphing into place;
// `from` tells that page which list it came from, so it can swipe to the next and previous.
export function CardGallery({
  cards,
  viewerId,
  showAuthor = true,
  from,
}: {
  cards: GalleryCard[];
  viewerId?: string; // your own cards are labelled "You"
  showAuthor?: boolean;
  from?: string; // e.g. "all", "friends", "u:name" (lib/social/card-list.ts)
}) {
  return (
    <ul className="columns-2 gap-3 sm:columns-3 [&>li]:mb-4">
      {cards.map((c, i) => {
        const own = c.author.userId === viewerId;
        return (
          <li key={c.id} className="animate-rise relative break-inside-avoid" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
            <Wrap own={own} card={c.id} reaction={c.reaction}>
            <Link
              href={from ? `/cards/${c.id}?from=${encodeURIComponent(from)}` : `/cards/${c.id}`}
              transitionTypes={["nav-forward"]}
              className="group block active:scale-[0.98] transition-transform"
            >
              <MemoryCard
                style={c.style}
                reference={c.reference}
                translation={c.translation}
                text={c.text}
                morphId={c.id}
                className="transition-[filter] group-hover:brightness-[1.03]"
              />
              <span className="mt-1.5 flex h-7 items-center gap-1.5 px-0.5 pr-12 text-xs text-muted-foreground">
                {showAuthor && (
                  <>
                    <Avatar name={c.author.displayName} username={c.author.username} src={c.author.avatarUrl} className="size-5 text-[0.6rem]" />
                    <span className="truncate">{own ? "You" : `@${c.author.username}`}</span>
                  </>
                )}
              </span>
            </Link>
            </Wrap>
            {/* Outside the link, so a tap likes instead of opening the card. Your own show a count. */}
            <div className="absolute right-0 bottom-0">
              {own ? (
                c.likes > 0 && <LikeCount n={c.likes} />
              ) : (
                <LikeButton target={{ card: c.id }} likes={c.likes} liked={c.liked} reaction={c.reaction} top={c.top} size="sm" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Someone else's card is held to react to it; your own just opens.
function Wrap({ own, card, reaction, children }: { own: boolean; card: string; reaction: string | null; children: React.ReactNode }) {
  if (own) return children;
  return (
    <CardReact card={card} reaction={reaction}>
      {children}
    </CardReact>
  );
}

function LikeCount({ n }: { n: number }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 px-1.5 text-xs text-muted-foreground tabular-nums" aria-label={`${n} likes`}>
      <Heart className="size-3.5 fill-current" aria-hidden />
      {n}
    </span>
  );
}
