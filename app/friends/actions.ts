"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { acceptFriend, removeFriend, requestFriend, type Relation } from "@/lib/social/friends";
import { removeUploadedAvatar } from "@/lib/social/avatars";
import { setAvatar, updateProfile } from "@/lib/social/profiles";

const id = z.uuid();

function refresh() {
  revalidatePath("/friends");
  revalidatePath("/u/[username]", "page");
  revalidatePath("/search");
}

export async function addFriend(username: string): Promise<{ error?: string; relation?: Relation }> {
  const user = await requireUser();
  const result = await requestFriend(user.id, username);
  refresh();
  return result;
}

export async function acceptFriendRequest(otherId: string) {
  const user = await requireUser();
  if (!id.safeParse(otherId).success) return;
  await acceptFriend(user.id, otherId);
  refresh();
}

// Decline, cancel or unfriend: all remove the pair.
export async function removeFriendship(otherId: string) {
  const user = await requireUser();
  if (!id.safeParse(otherId).success) return;
  await removeFriend(user.id, otherId);
  refresh();
}

export type ProfileFormState = { error?: string; saved?: boolean; username?: string; displayName?: string };

export async function saveProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const result = await updateProfile(user.id, { username, displayName });
  if (result.error) return { error: result.error, username, displayName };
  revalidatePath("/", "layout");
  redirect(`/u/${username.trim().replace(/^@+/, "").toLowerCase()}`);
}

// Puts the Google account's picture back as the profile picture.
export async function restoreGooglePhoto(): Promise<{ url?: string; error?: string }> {
  const user = await requireUser();
  if (!user.avatarUrl) return { error: "There's no Google photo to use." };
  await removeUploadedAvatar(user.id);
  await setAvatar(user.id, user.avatarUrl);
  revalidatePath("/", "layout");
  return { url: user.avatarUrl };
}
