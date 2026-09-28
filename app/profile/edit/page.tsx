import type { Metadata } from "next";
import { AvatarEditor } from "@/components/avatar-editor";
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
      <AvatarEditor name={profile.displayName} username={profile.username} current={profile.avatarUrl} google={user.avatarUrl} />
      <div className="mt-4">
        <ProfileForm username={profile.username} displayName={profile.displayName} />
      </div>
    </Screen>
  );
}
