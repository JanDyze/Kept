"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, Loader2, Share2, UserPlus, X } from "lucide-react";
import { acceptFriendRequest, addFriend, removeFriendship, saveProfile, type ProfileFormState } from "@/app/friends/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Relation } from "@/lib/social/friends";
import { cn } from "@/lib/utils";

const pill = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors disabled:opacity-60";

// What you can do about someone, given where the two of you stand.
export function FriendButton({
  userId,
  username,
  relation: initial,
  compact,
}: {
  userId: string;
  username: string;
  relation: Relation;
  compact?: boolean;
}) {
  const [relation, setRelation] = useState(initial);
  const [pending, start] = useTransition();
  const run = (next: Relation, work: () => Promise<unknown>) =>
    start(async () => {
      const was = relation;
      setRelation(next);
      try {
        await work();
      } catch {
        setRelation(was);
      }
    });

  if (relation === "self") return null;
  if (relation === "none")
    return (
      <button type="button" disabled={pending} onClick={() => run("asked", () => addFriend(username))} className={cn(pill, "bg-primary text-primary-foreground hover:bg-primary/85")}>
        <UserPlus className="size-4" aria-hidden /> Add friend
      </button>
    );
  if (relation === "asked")
    return (
      <button type="button" disabled={pending} onClick={() => run("none", () => removeFriendship(userId))} className={cn(pill, "border text-muted-foreground hover:bg-muted")}>
        Requested <X className="size-3.5" aria-label="Cancel request" />
      </button>
    );
  if (relation === "asked-you")
    return (
      <span className="flex gap-1.5">
        <button type="button" disabled={pending} onClick={() => run("friends", () => acceptFriendRequest(userId))} className={cn(pill, "bg-primary text-primary-foreground hover:bg-primary/85")}>
          <Check className="size-4" aria-hidden /> Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("none", () => removeFriendship(userId))}
          aria-label="Decline"
          className={cn(pill, "border px-2.5 text-muted-foreground hover:bg-muted")}
        >
          <X className="size-4" aria-hidden />
          {!compact && "Decline"}
        </button>
      </span>
    );
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Remove @${username} from your friends?`)) run("none", () => removeFriendship(userId));
      }}
      className={cn(pill, "border text-muted-foreground hover:bg-muted")}
    >
      <Check className="size-4" aria-hidden /> Friends
    </button>
  );
}

// Add a friend by their username.
export function AddFriendForm() {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const username = value.trim().replace(/^@+/, "");
        if (!username) return;
        setMessage(null);
        start(async () => {
          const result = await addFriend(username);
          if (result.error) setMessage({ ok: false, text: result.error });
          else {
            setMessage({ ok: true, text: result.relation === "friends" ? `You and @${username} are friends.` : `Asked @${username}.` });
            setValue("");
          }
        });
      }}
    >
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">@</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="username"
            aria-label="Friend's username"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            className="h-11 w-full rounded-xl border border-input bg-card pr-3 pl-8 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </label>
        <Button type="submit" disabled={pending || !value.trim()} className="h-11 gap-1.5 px-4 text-base">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />} Add
        </Button>
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={cn("mt-2 text-sm", message.ok ? "text-muted-foreground" : "text-destructive")}>
          {message.text}
        </p>
      )}
    </form>
  );
}

// Copy your username (to type into a friend's Add box), or share your profile link: the phone's
// share sheet where there is one, otherwise the link is copied.
export function ShareProfile({ username }: { username: string }) {
  const [copied, setCopied] = useState<"username" | "link" | null>(null);
  const copy = async (what: "username" | "link", text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  };
  const url = () => `${location.origin}/u/${username}`;
  return (
    <span className="flex gap-1.5">
      <button type="button" onClick={() => void copy("username", username)} className={cn(pill, "border text-muted-foreground hover:bg-muted")}>
        {copied === "username" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied === "username" ? "Copied" : "Copy username"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (typeof navigator.share === "function")
            void navigator.share({ url: url(), title: `@${username} on Kept` }).catch(() => {});
          else void copy("link", url());
        }}
        aria-label={copied === "link" ? "Link copied" : "Share profile link"}
        className={cn(pill, "border px-2.5 text-muted-foreground hover:bg-muted")}
      >
        {copied === "link" ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      </button>
    </span>
  );
}

// Username and display name, in Settings.
export function ProfileForm({ username, displayName }: { username: string; displayName: string | null }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Username</span>
        <span className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            name="username"
            defaultValue={state.username ?? username}
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            required
            aria-invalid={Boolean(state.error)}
            className="h-11 rounded-xl pl-8 text-base"
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Name</span>
        <Input name="displayName" defaultValue={state.displayName ?? displayName ?? ""} maxLength={40} autoComplete="name" className="h-11 rounded-xl text-base" />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="outline" disabled={pending} className="h-10 gap-1.5 self-end px-4">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : state.saved ? <Check className="size-4" aria-hidden /> : null}
        {state.saved && !pending ? "Saved" : "Save"}
      </Button>
    </form>
  );
}
