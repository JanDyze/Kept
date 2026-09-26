import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Image src="/logo-animated.svg" alt="" width={80} height={80} priority unoptimized className="dark:brightness-0 dark:invert" />
        <div>
          <h1 className="font-brand text-4xl font-semibold tracking-tight">Kept</h1>
          <p className="mt-1 text-muted-foreground">Sign in to keep your verses.</p>
        </div>
      </div>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
