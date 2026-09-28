import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { AddFriendForm, FriendButton, ShareProfile } from "@/components/friends";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { listFriends } from "@/lib/social/friends";
import { getOrCreateProfile, type Profile } from "@/lib/social/profiles";

export const metadata: Metadata = { title: "Friends" };

// Your username to share, a box to add someone by theirs, requests waiting on you, and your friends.
export default async function FriendsPage() {
  const user = await requireUser();
  const [me, lists] = await Promise.all([getOrCreateProfile(user), listFriends(user.id)]);

  return (
    <Screen back={{ href: "/search", label: "Discover" }} title="Friends" subtitle={`@${me.username}`}>
      <section className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <Avatar name={me.displayName} username={me.username} className="size-12 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{me.displayName ?? `@${me.username}`}</p>
          <p className="truncate text-sm text-muted-foreground">@{me.username}</p>
        </div>
        <ShareProfile username={me.username} />
      </section>

      <section aria-labelledby="add-friend" className="mt-7">
        <h2 id="add-friend" className="mb-2 text-sm font-medium text-muted-foreground">
          Add a friend
        </h2>
        <AddFriendForm />
      </section>

      {lists.incoming.length > 0 && <People title="Asked you" people={lists.incoming} relation="asked-you" />}
      <People title="Friends" people={lists.friends} relation="friends" empty="No friends yet." />
      {lists.outgoing.length > 0 && <People title="You asked" people={lists.outgoing} relation="asked" />}
    </Screen>
  );
}

function People({
  title,
  people,
  relation,
  empty,
}: {
  title: string;
  people: Profile[];
  relation: "friends" | "asked" | "asked-you";
  empty?: string;
}) {
  return (
    <section aria-label={title} className="mt-7">
      <h2 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
        {title}
        {people.length > 0 && <span className="text-xs tabular-nums">{people.length}</span>}
      </h2>
      {people.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {people.map((p) => (
            <li key={p.userId} className="flex items-center gap-3 py-2.5 pr-3 pl-4">
              <Link href={`/u/${p.username}`} transitionTypes={["nav-forward"]} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={p.displayName} username={p.username} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.displayName ?? `@${p.username}`}</span>
                  <span className="block truncate text-sm text-muted-foreground">@{p.username}</span>
                </span>
              </Link>
              <FriendButton userId={p.userId} username={p.username} relation={relation} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
