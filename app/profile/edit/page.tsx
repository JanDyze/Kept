import type { Metadata } from "next";
import { AvatarEditor } from "@/components/avatar-editor";
import { ProfileForm } from "@/components/friends";
import { GuestSave } from "@/components/guest-save";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/social/profiles";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);
  if (user.guest) {
    return (
      <Screen back={{ href: `/u/${profile.username}`, label: "You" }} title="Edit profile">
        <GuestSave title="Make it yours" detail="Save with Google to pick a name, a username and a photo. Your verses and games come with you." next="/profile/edit" />
      </Screen>
    );
  }
  return (
    <Screen back={{ href: `/u/${profile.username}`, label: "You" }} title="Edit profile">
      <AvatarEditor name={profile.displayName} username={profile.username} current={profile.avatarUrl} google={user.avatarUrl} />
      <div className="mt-4">
        <ProfileForm username={profile.username} displayName={profile.displayName} />
      </div>
    </Screen>
  );
}
