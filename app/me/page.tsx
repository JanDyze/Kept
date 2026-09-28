import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/social/profiles";

// A stable address for your own profile (/me), whatever your username is.
export default async function MePage() {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);
  redirect(`/u/${profile.username}`);
}
