import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

// Why a sign-in link or Google sign-in brought someone back here.
const LINK_MESSAGES = {
  expired: "That sign-in link has expired or was already used. Try again.",
  google: "Google sign-in isn't available right now. Use your email instead.",
  cancelled: "Google sign-in was cancelled.",
};

export async function generateMetadata({ searchParams }: PageProps<"/login">): Promise<Metadata> {
  const { mode } = await searchParams;
  return { title: mode === "signup" ? "Create an account" : "Sign in" };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, mode, link } = await searchParams;
  const signingUp = mode === "signup";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Image src="/logo-animated.svg" alt="" width={80} height={80} priority unoptimized className="dark:brightness-0 dark:invert" />
        <div>
          <h1 className="font-brand text-4xl font-semibold tracking-tight">Kept</h1>
          <p className="mt-1 text-muted-foreground">{signingUp ? "Make an account to keep your verses." : "Sign in to keep your verses."}</p>
        </div>
      </div>
      {typeof link === "string" && link in LINK_MESSAGES && (
        <p role="alert" className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {LINK_MESSAGES[link as keyof typeof LINK_MESSAGES]}
        </p>
      )}
      <LoginForm key={signingUp ? "signup" : "signin"} mode={signingUp ? "signup" : "signin"} next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
