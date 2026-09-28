import Link from "next/link";
import { Flame, Pencil, Settings } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CardGallery } from "@/components/card-gallery";
import { FriendButton, ShareProfile } from "@/components/friends";
import { Screen } from "@/components/screen";
import type { Relation } from "@/lib/social/friends";
import type { GalleryCard } from "@/lib/social/gallery";
import type { Profile } from "@/lib/social/profiles";
import type { ProfileStats } from "@/lib/social/stats";
import { cn } from "@/lib/utils";

// A person on Kept (you, a friend, anyone): who they are, their numbers, and the cards they've
// shown you. Your own page is also where your profile is edited and Settings live.
export function ProfileView({
  person,
  relation,
  stats,
  cards,
}: {
  person: Profile;
  relation: Relation;
  stats: ProfileStats;
  cards: GalleryCard[];
}) {
  const self = relation === "self";
  const numbers = [
    { label: "day streak", value: stats.streak, icon: stats.streak > 0, href: self ? "/stats" : undefined },
    { label: stats.verses === 1 ? "verse" : "verses", value: stats.verses },
    { label: "games won", value: stats.gamesWon },
    { label: stats.friends === 1 ? "friend" : "friends", value: stats.friends, href: self ? "/friends" : undefined },
  ];

  return (
    <Screen
      back={self ? { href: "/", label: "Home" } : { href: "/friends", label: "Friends" }}
      title={self ? "You" : undefined}
      action={
        self && (
          <Link
            href="/settings"
            transitionTypes={["nav-forward"]}
            aria-label="Settings"
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-5" aria-hidden />
          </Link>
        )
      }
    >
      <section className="flex flex-col items-center text-center">
        <Avatar name={person.displayName} username={person.username} className="size-20 text-3xl" />
        <h1 className="mt-3 font-brand text-2xl font-semibold tracking-tight">{person.displayName ?? `@${person.username}`}</h1>
        {person.displayName && <p className="text-muted-foreground">@{person.username}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {self ? (
            <>
              <Link
                href="/profile/edit"
                transitionTypes={["nav-forward"]}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <Pencil className="size-4" aria-hidden /> Edit profile
              </Link>
              <ShareProfile username={person.username} />
            </>
          ) : (
            <FriendButton userId={person.userId} username={person.username} relation={relation} />
          )}
        </div>
      </section>

      <dl className="mt-7 grid grid-cols-4 divide-x rounded-2xl border bg-card py-3.5">
        {numbers.map((n) => {
          const body = (
            <>
              <dt className="mt-0.5 text-xs text-muted-foreground">{n.label}</dt>
              <dd className="flex items-center justify-center gap-1 font-brand text-2xl font-semibold tabular-nums tracking-tight">
                {n.icon && <Flame className="size-4.5 text-icon-accent" aria-hidden />}
                {n.value.toLocaleString()}
              </dd>
            </>
          );
          return n.href ? (
            <Link key={n.label} href={n.href} transitionTypes={["nav-forward"]} className="flex flex-col-reverse items-center px-1 text-center hover:opacity-80">
              {body}
            </Link>
          ) : (
            <div key={n.label} className="flex flex-col-reverse items-center px-1 text-center">
              {body}
            </div>
          );
        })}
      </dl>

      <section aria-labelledby="shared" className="mt-8">
        <h2 id="shared" className="mb-3 flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
          Shared verses
          {cards.length > 0 && <span className="text-xs tabular-nums">{cards.length}</span>}
        </h2>
        {cards.length > 0 ? (
          <CardGallery cards={cards} showAuthor={false} />
        ) : (
          <p className={cn("rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground")}>
            {self ? (
              <>
                None yet.{" "}
                <Link href="/verses" transitionTypes={["nav-forward"]} className="font-medium text-primary underline-offset-4 hover:underline">
                  Share a card
                </Link>
              </>
            ) : (
              "None yet."
            )}
          </p>
        )}
      </section>
    </Screen>
  );
}
