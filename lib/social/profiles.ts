import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { SessionUser } from "@/lib/auth";
import { APP_VERSION } from "@/lib/changelog";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { guestUsername, isGuestUsername, normalizeUsername, suggestUsername, usernameProblem } from "./username";

export type Profile = { userId: string; username: string; displayName: string | null; avatarUrl: string | null };

const columns = {
  userId: profiles.userId,
  username: profiles.username,
  displayName: profiles.displayName,
  avatarUrl: profiles.avatarUrl,
};

// Everyone has a profile; the first time one is needed it's made from their name or email, taking
// the first free "name", "name2", "name3"… so no one has to pick a username before using the app.
export async function getOrCreateProfile(user: SessionUser): Promise<Profile> {
  const [existing] = await db
    .select({ ...columns, avatarRemoved: profiles.avatarRemoved })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);
  if (existing) {
    const { avatarRemoved, ...profile } = existing;
    // A guest who just saved their account with Google: their name, picture and a real username.
    if (!user.guest && isGuestUsername(profile.username)) return claimGoogleName(user, profile);
    // A Google picture fills an empty avatar, unless they took theirs off on purpose.
    if (!profile.avatarUrl && !avatarRemoved && user.avatarUrl) {
      await db.update(profiles).set({ avatarUrl: user.avatarUrl }).where(eq(profiles.userId, user.id));
      return { ...profile, avatarUrl: user.avatarUrl };
    }
    return profile;
  }

  const base = suggestUsername(user.name, user.email);
  const displayName = user.name;
  for (let n = 1; n < 50; n++) {
    const username = user.guest ? guestUsername() : n === 1 ? base : `${base.slice(0, 20 - String(n).length)}${n}`;
    const [made] = await db
      .insert(profiles)
      // A new account has nothing to catch up on: What's new starts from the next release.
      .values({ userId: user.id, username, displayName, avatarUrl: user.avatarUrl, seenVersion: APP_VERSION })
      .onConflictDoNothing()
      .returning(columns);
    if (made) return made;
    // Either the name was taken, or a parallel request just made this user's profile.
    const [mine] = await db.select(columns).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    if (mine) return mine;
  }
  throw new Error("Couldn't make a username");
}

async function claimGoogleName(user: SessionUser, profile: Profile): Promise<Profile> {
  const base = suggestUsername(user.name, user.email);
  const avatarUrl = profile.avatarUrl ?? user.avatarUrl;
  const displayName = profile.displayName ?? user.name;
  for (let n = 1; n < 50; n++) {
    const username = n === 1 ? base : `${base.slice(0, 20 - String(n).length)}${n}`;
    const [taken] = await db.select({ id: profiles.userId }).from(profiles).where(eq(profiles.username, username)).limit(1);
    if (taken) continue;
    try {
      await db.update(profiles).set({ username, displayName, avatarUrl }).where(eq(profiles.userId, user.id));
      return { ...profile, username, displayName, avatarUrl };
    } catch {
      // Someone took the name in between: try the next one.
    }
  }
  return profile;
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

// Sets or clears the picture. Clearing remembers the choice, so Google's won't come back on its own.
export async function setAvatar(userId: string, avatarUrl: string | null) {
  await db.update(profiles).set({ avatarUrl, avatarRemoved: avatarUrl === null }).where(eq(profiles.userId, userId));
}

// Which release's What's new they last saw (null for accounts made before there was one).
export async function seenVersion(userId: string) {
  const [row] = await db.select({ v: profiles.seenVersion }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return row?.v ?? null;
}

export async function markVersionSeen(userId: string, version: string) {
  await db.update(profiles).set({ seenVersion: version }).where(eq(profiles.userId, userId));
}

export type ProfileUpdate ={ username: string; displayName: string };

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
