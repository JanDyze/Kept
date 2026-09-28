import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MemoryCard } from "@/components/memory-card";
import type { GalleryCard } from "@/lib/social/gallery";

// Cards in a masonry grid (two columns on a phone, three wider): portrait, square and landscape
// cards stack at their own heights, Pinterest-style. Each opens its page, morphing into place.
export function CardGallery({
  cards,
  viewerId,
  showAuthor = true,
}: {
  cards: GalleryCard[];
  viewerId?: string; // your own cards are labelled "You"
  showAuthor?: boolean;
}) {
  return (
    <ul className="columns-2 gap-3 sm:columns-3 [&>li]:mb-4">
      {cards.map((c, i) => (
        <li key={c.id} className="animate-rise break-inside-avoid" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
          <Link href={`/cards/${c.id}`} transitionTypes={["nav-forward"]} className="group block active:scale-[0.98] transition-transform">
            <MemoryCard
              style={c.style}
              reference={c.reference}
              translation={c.translation}
              text={c.text}
              morphId={c.id}
              className="transition-[filter] group-hover:brightness-[1.03]"
            />
            {showAuthor && (
              <span className="mt-1.5 flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground">
                <Avatar name={c.author.displayName} username={c.author.username} className="size-5 text-[0.6rem]" />
                <span className="truncate">{c.author.userId === viewerId ? "You" : `@${c.author.username}`}</span>
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
