import "server-only";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { getProfileByUsername, getProfiles, type Profile } from "./profiles";

// Friendships between two people: a request, then accepted. One row per pair. Every function takes
// the signed-in user's id and only touches rows they're part of.

export type Relation = "self" | "none" | "friends" | "asked" | "asked-you";

const between = (a: string, b: string) =>
  or(
    and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
    and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
  );

async function pairRow(a: string, b: string) {
  const [row] = await db.select().from(friendships).where(between(a, b)).limit(1);
  return row ?? null;
}

export async function relationTo(viewerId: string, otherId: string): Promise<Relation> {
  if (viewerId === otherId) return "self";
  const row = await pairRow(viewerId, otherId);
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requesterId === viewerId ? "asked" : "asked-you";
}

// Asks someone to be friends. If they had already asked you, this accepts instead.
// `event` says what changed for the other person, so they can be told (lib/notify.ts).
export async function requestFriend(
  userId: string,
  username: string,
): Promise<{ error?: string; relation?: Relation; event?: { otherId: string; kind: "requested" | "accepted" } }> {
  const other = await getProfileByUsername(username);
  if (!other) return { error: "No one has that username." };
  if (other.userId === userId) return { error: "That's you." };

  const row = await pairRow(userId, other.userId);
  if (row?.status === "accepted") return { relation: "friends" };
  if (row && row.requesterId === userId) return { relation: "asked" };
  if (row) {
    await db.update(friendships).set({ status: "accepted", respondedAt: new Date() }).where(eq(friendships.id, row.id));
    return { relation: "friends", event: { otherId: other.userId, kind: "accepted" } };
  }
  const added = await db
    .insert(friendships)
    .values({ requesterId: userId, addresseeId: other.userId })
    .onConflictDoNothing()
    .returning({ id: friendships.id });
  return { relation: "asked", event: added.length ? { otherId: other.userId, kind: "requested" } : undefined };
}

// Accepts a request someone sent you.
// True when there was a request to accept.
export async function acceptFriend(userId: string, otherId: string) {
  const rows = await db
    .update(friendships)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, userId), eq(friendships.status, "pending")))
    .returning({ id: friendships.id });
  return rows.length > 0;
}

// Declines a request, cancels one you sent, or ends a friendship: either way the pair is removed.
export async function removeFriend(userId: string, otherId: string) {
  await db.delete(friendships).where(between(userId, otherId));
}

export type FriendLists = { friends: Profile[]; incoming: Profile[]; outgoing: Profile[] };

export async function listFriends(userId: string): Promise<FriendLists> {
  const rows = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)))
    .orderBy(sql`coalesce(${friendships.respondedAt}, ${friendships.createdAt}) desc`);
  const otherOf = (r: (typeof rows)[number]) => (r.requesterId === userId ? r.addresseeId : r.requesterId);
  const people = await getProfiles(rows.map(otherOf));
  const pick = (keep: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(keep).flatMap((r) => people.get(otherOf(r)) ?? []);
  return {
    friends: pick((r) => r.status === "accepted"),
    incoming: pick((r) => r.status === "pending" && r.addresseeId === userId),
    outgoing: pick((r) => r.status === "pending" && r.requesterId === userId),
  };
}

// The ids of the user's friends, for deciding whose "friends" cards they can see.
export async function friendIds(userId: string) {
  const rows = await db
    .select({ a: friendships.requesterId, b: friendships.addresseeId })
    .from(friendships)
    .where(and(eq(friendships.status, "accepted"), or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))));
  return rows.map((r) => (r.a === userId ? r.b : r.a));
}

export async function pendingRequestCount(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(friendships)
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
  return row?.n ?? 0;
}
