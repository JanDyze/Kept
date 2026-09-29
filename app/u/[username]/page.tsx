import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { requireUser } from "@/lib/auth";
import { getTimeZone, localDate } from "@/lib/day";
import { pendingRequestCount, relationTo } from "@/lib/social/friends";
import { galleryCards } from "@/lib/social/gallery";
import { getProfileByUsername } from "@/lib/social/profiles";
import { profileStats } from "@/lib/social/stats";
import { progressStats } from "@/lib/stats";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

export default async function ProfilePage({ params, searchParams }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const tab = (await searchParams).tab === "shared" ? "shared" : "progress";
  const user = await requireUser();
  const person = await getProfileByUsername(decodeURIComponent(username));
  if (!person) notFound();

  const day = localDate(await getTimeZone());
  const [relation, cards, stats] = await Promise.all([
    relationTo(user.id, person.userId),
    galleryCards(user.id, { authorId: person.userId }),
    profileStats(person.userId, day),
  ]);

  // Your own profile also has your progress in detail (only you ever see it).
  const self = relation === "self";
  const [progress, requests] = await Promise.all([
    self && tab === "progress" ? progressStats(user.id, day).then((s) => ({ s, day })) : undefined,
    self ? pendingRequestCount(user.id) : 0,
  ]);

  return (
    <ProfileView
      person={person}
      relation={relation}
      stats={stats}
      cards={cards}
      tab={self ? tab : "shared"}
      progress={progress}
      requests={requests}
      guest={self && user.guest}
    />
  );
}
