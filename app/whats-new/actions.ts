"use server";

import { requireUser } from "@/lib/auth";
import { APP_VERSION } from "@/lib/changelog";
import { markVersionSeen } from "@/lib/social/profiles";

// What's new was seen (closed or read): it won't show again until the next release.
export async function dismissWhatsNew() {
  const user = await requireUser();
  await markVersionSeen(user.id, APP_VERSION);
}
