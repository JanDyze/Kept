import type { Metadata } from "next";
import Image from "next/image";
import { Avatar } from "@/components/avatar";
import { getProfileByUsername } from "@/lib/social/profiles";
import { LoginForm } from "./login-form";

// Why Google or Apple sign-in (or an old email link) brought someone back here.
const LINK_MESSAGES = {
  expired: "That sign-in link has expired or was already used. Try again.",
  google: "Google sign-in isn't available right now. Try again in a moment.",
  apple: "Apple sign-in isn't available right now. Try again in a moment.",
  cancelled: "Sign-in was cancelled.",
  guest: "Guest mode isn't available right now. Sign in with Google or Apple instead.",
};

export const metadata: Metadata = { title: "Sign in" };

// Continue as guest and Continue with Apple show only while they're on in Supabase (checked every
// 5 min), so neither is offered before it works.
async function providers() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    });
    const settings = (await res.json()) as { external?: { anonymous_users?: boolean; apple?: boolean } };
    return { guests: settings.external?.anonymous_users === true, apple: settings.external?.apple === true };
  } catch {
    return { guests: false, apple: false };
  }
}

// One way in: Continue with Google or Apple, which also makes the account the first time.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, link } = await searchParams;
  // Arriving from someone's profile link (/u/name): show whose, so the link feels like theirs.
  const inviter = typeof next === "string" ? /^\/u\/([^/?#]+)/.exec(next)?.[1] : undefined;
  const [person, { guests, apple }] = await Promise.all([
    inviter ? getProfileByUsername(decodeURIComponent(inviter)).catch(() => null) : null,
    providers(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        {person ? (
          // Uploaded pictures are for signed-in eyes only, so a signed-out visitor sees the initial.
          <Avatar
            name={person.displayName}
            username={person.username}
            src={person.avatarUrl?.startsWith("https://") ? person.avatarUrl : null}
            eager
            className="size-20 text-3xl"
          />
        ) : (
          <Image src="/logo-animated.svg" alt="" width={80} height={80} priority unoptimized className="dark:brightness-0 dark:invert" />
        )}
        <div>
          <h1 className="font-brand text-4xl font-semibold tracking-tight">Kept</h1>
          <p className="mt-1 text-muted-foreground">
            {person ? `Sign in to add ${person.displayName ?? `@${person.username}`} as a friend.` : "Memorize Scripture, one verse at a time."}
          </p>
        </div>
      </div>
      {typeof link === "string" && link in LINK_MESSAGES && (
        <p role="alert" className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {LINK_MESSAGES[link as keyof typeof LINK_MESSAGES]}
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} guests={guests} apple={apple} />
    </main>
  );
}
