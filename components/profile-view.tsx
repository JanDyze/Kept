import Link from "next/link";
import { Flame, Pencil, Settings } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CardGallery } from "@/components/card-gallery";
import { CountBadge } from "@/components/count-badge";
import { CopyUsername, FriendButton, ShareProfile } from "@/components/friends";
import { GuestSave } from "@/components/guest-save";
import { ProgressDetails } from "@/components/progress-details";
import { Screen } from "@/components/screen";
import type { Relation } from "@/lib/social/friends";
import type { GalleryCard } from "@/lib/social/gallery";
import type { Profile } from "@/lib/social/profiles";
import type { ProfileStats } from "@/lib/social/stats";
import type { progressStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

// A person on Kept (you, a friend, anyone): who they are, their numbers, and the cards they've
// shown you. Your own page is also where your profile is edited and Settings live.
export function ProfileView({
  person,
  relation,
  stats,
  cards,
  tab = "shared",
  progress,
  requests = 0,
  guest = false,
}: {
  person: Profile;
  relation: Relation;
  stats: ProfileStats;
  cards: GalleryCard[];
  tab?: "progress" | "shared"; // your own profile opens on Progress
  progress?: { s: Awaited<ReturnType<typeof progressStats>>; day: string }; // yours only
  requests?: number; // friend requests waiting on you (yours only)
  guest?: boolean; // your own page while you're a guest: no name to show or profile to share yet
}) {
  const self = relation === "self";
  const numbers = [
    { label: "day streak", value: stats.streak, icon: stats.streak > 0 },
    { label: stats.verses === 1 ? "verse" : "verses", value: stats.verses, href: self ? "/verses" : undefined },
    { label: "games won", value: stats.gamesWon, href: self ? "/games" : undefined },
    {
      label: stats.friends === 1 ? "friend" : "friends",
      value: stats.friends,
      href: self ? "/friends" : undefined,
      badge: self ? requests : 0,
    },
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
        <Avatar
          name={person.displayName}
          username={person.username}
          src={person.avatarUrl}
          eager
          className="size-20 text-3xl"
        />
        {/* The copy button hangs off the right, so the name itself stays centered. */}
        <h1
          className={cn(
            "mt-3 flex items-center gap-1 font-brand text-2xl font-semibold tracking-tight",
            !guest && !person.displayName && "-mr-9",
          )}
        >
          {guest ? "Guest" : (person.displayName ?? `@${person.username}`)}
          {!guest && !person.displayName && <CopyUsername username={person.username} />}
        </h1>
        {person.displayName && !guest && (
          <p className="-mr-8 flex items-center gap-0.5 text-muted-foreground">
            @{person.username}
            <CopyUsername username={person.username} />
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {guest ? (
            <GuestSave next="/me" className="w-full text-left" />
          ) : self ? (
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
              <dd className="relative flex items-center justify-center gap-1 font-brand text-2xl font-semibold tabular-nums tracking-tight">
                {n.icon && <Flame className="size-4.5 text-icon-accent" aria-hidden />}
                {n.value.toLocaleString()}
                {"badge" in n && <CountBadge count={n.badge ?? 0} className="-top-1 -right-4" />}
                {"badge" in n && (n.badge ?? 0) > 0 && <span className="sr-only">, {n.badge} waiting</span>}
              </dd>
            </>
          );
          return n.href ? (
            <Link
              key={n.label}
              href={n.href}
              transitionTypes={["nav-forward"]}
              className="flex flex-col-reverse items-center px-1 text-center hover:opacity-80"
            >
              {body}
            </Link>
          ) : (
            <div key={n.label} className="flex flex-col-reverse items-center px-1 text-center">
              {body}
            </div>
          );
        })}
      </dl>

      {self && (
        <div role="tablist" aria-label="Your profile" className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["progress", "Progress"],
              ["shared", `Shared${cards.length ? ` · ${cards.length}` : ""}`],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              role="tab"
              aria-selected={tab === value}
              href={value === "progress" ? `/u/${person.username}` : `/u/${person.username}?tab=shared`}
              replace
              scroll={false}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-[background-color,color,box-shadow]",
                tab === value
                  ? "bg-background text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {self && tab === "progress" && progress && (
        <div className="mt-5">
          <ProgressDetails s={progress.s} day={progress.day} />
        </div>
      )}

      {(!self || tab === "shared") && (
        <section aria-labelledby="shared" className={self ? "mt-5" : "mt-8"}>
          {!self && (
            <h2 id="shared" className="mb-3 flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
              Shared verses
              {cards.length > 0 && <span className="text-xs tabular-nums">{cards.length}</span>}
            </h2>
          )}
          {cards.length > 0 ? (
            <CardGallery cards={cards} showAuthor={false} viewerId={self ? person.userId : undefined} from={`u:${person.username}`} />
          ) : (
            <p className={cn("rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground")}>
              {self ? (
                <>
                  None yet.{" "}
                  <Link
                    href="/verses"
                    transitionTypes={["nav-forward"]}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Share a card
                  </Link>
                </>
              ) : (
                "None yet."
              )}
            </p>
          )}
        </section>
      )}
    </Screen>
  );
}
