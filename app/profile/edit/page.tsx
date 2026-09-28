import type { Metadata } from "next";
import { ProfileForm } from "@/components/friends";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/social/profiles";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);
  return (
    <Screen back={{ href: `/u/${profile.username}`, label: "You" }} title="Edit profile">
      <ProfileForm username={profile.username} displayName={profile.displayName} />
    </Screen>
  );
}
