import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

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
      {link === "expired" && (
        <p role="alert" className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          That link has expired or was already used. Sign in, or create your account again.
        </p>
      )}
      <LoginForm key={signingUp ? "signup" : "signin"} mode={signingUp ? "signup" : "signin"} next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
