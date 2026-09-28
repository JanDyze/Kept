import "server-only";
import { eq } from "drizzle-orm";
import { deleteImage } from "@/lib/cards/storage";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

// Uploaded profile pictures live beside card photos under avatars/<userId>/<file>.
const OWN = /^\/api\/avatars\/[\w-]+\/([\w-]+\.(?:jpg|png|webp))$/;

// Deletes the user's uploaded picture file, if their current picture is one (not Google's).
export async function removeUploadedAvatar(userId: string) {
  const [row] = await db.select({ url: profiles.avatarUrl }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const file = row?.url?.match(OWN)?.[1];
  if (file) await deleteImage(`avatars/${userId}/${file}`);
}
