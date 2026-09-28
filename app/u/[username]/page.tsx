import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CardGallery } from "@/components/card-gallery";
import { FriendButton, ShareProfile } from "@/components/friends";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { relationTo } from "@/lib/social/friends";
import { galleryCards } from "@/lib/social/gallery";
import { getProfileByUsername } from "@/lib/social/profiles";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

// Someone on Kept: who they are, where you stand, and the cards they've shown you.
export default async function ProfilePage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const user = await requireUser();
  const person = await getProfileByUsername(decodeURIComponent(username));
  if (!person) notFound();

  const [relation, cards] = await Promise.all([
    relationTo(user.id, person.userId),
    galleryCards(user.id, { authorId: person.userId }),
  ]);
  const self = relation === "self";

  return (
    <Screen back={{ href: "/friends", label: "Friends" }}>
      <section className="flex flex-col items-center text-center">
        <Avatar name={person.displayName} username={person.username} className="size-20 text-3xl" />
        <h1 className="mt-3 font-brand text-2xl font-semibold tracking-tight">{person.displayName ?? `@${person.username}`}</h1>
        <p className="text-muted-foreground">@{person.username}</p>
        <div className="mt-4">
          {self ? <ShareProfile username={person.username} /> : <FriendButton userId={person.userId} username={person.username} relation={relation} />}
        </div>
      </section>

      <section aria-label="Cards" className="mt-8">
        {cards.length > 0 ? (
          <CardGallery cards={cards} showAuthor={false} />
        ) : (
          <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {self ? "Cards you share with friends or everyone show here." : relation === "friends" ? "No cards shared yet." : "No cards shared with everyone yet."}
          </p>
        )}
      </section>
    </Screen>
  );
}
