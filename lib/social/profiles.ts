import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { normalizeUsername, suggestUsername, usernameProblem } from "./username";

export type Profile = { userId: string; username: string; displayName: string | null };

const columns = { userId: profiles.userId, username: profiles.username, displayName: profiles.displayName };

// Everyone has a profile; the first time one is needed it's made from their name or email, taking
// the first free "name", "name2", "name3"… so no one has to pick a username before using the app.
export async function getOrCreateProfile(user: SessionUser): Promise<Profile> {
  const [existing] = await db.select(columns).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  if (existing) return existing;

  const base = suggestUsername(user.name, user.email);
  const displayName = user.name;
  for (let n = 1; n < 50; n++) {
    const username = n === 1 ? base : `${base.slice(0, 20 - String(n).length)}${n}`;
    const [made] = await db
      .insert(profiles)
      .values({ userId: user.id, username, displayName })
      .onConflictDoNothing()
      .returning(columns);
    if (made) return made;
    // Either the name was taken, or a parallel request just made this user's profile.
    const [mine] = await db.select(columns).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    if (mine) return mine;
  }
  throw new Error("Couldn't make a username");
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const [row] = await db.select(columns).from(profiles).where(eq(profiles.username, normalizeUsername(username))).limit(1);
  return row ?? null;
}

export async function getProfiles(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, Profile>();
  const rows = await db.select(columns).from(profiles).where(inArray(profiles.userId, userIds));
  return new Map(rows.map((r) => [r.userId, r]));
}

export type ProfileUpdate = { username: string; displayName: string };

export async function updateProfile(userId: string, input: ProfileUpdate): Promise<{ error?: string }> {
  const username = normalizeUsername(input.username);
  const problem = usernameProblem(username);
  if (problem) return { error: problem };
  const displayName = input.displayName.trim().slice(0, 40) || null;

  const [taken] = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.username, username)).limit(1);
  if (taken && taken.userId !== userId) return { error: "That username is taken." };

  try {
    await db.update(profiles).set({ username, displayName }).where(eq(profiles.userId, userId));
  } catch {
    return { error: "That username is taken." };
  }
  return {};
}
