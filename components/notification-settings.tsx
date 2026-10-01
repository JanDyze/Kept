"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { sendTestPush, setNotificationPref } from "@/app/settings/notify-actions";
import { deviceState, PUSH_KEY, turnOffPush, turnOnPush, type DeviceState } from "@/lib/push-client";
import { cn } from "@/lib/utils";

export type NotificationPrefs = { daily: boolean; friends: boolean; updates: boolean; email: boolean };

const KEY = PUSH_KEY;

const KINDS: { kind: keyof NotificationPrefs; label: string; detail: string; soon?: boolean }[] = [
  { kind: "daily", label: "Morning reminder", detail: "Today's verse and games, at 8 each morning" },
  { kind: "friends", label: "Friends", detail: "Reactions to your cards, and friend requests" },
  { kind: "updates", label: "What's new", detail: "When Kept gets something new" },
  { kind: "email", label: "Email too", detail: "The same by email — coming soon", soon: true },
];

// Settings → Notifications: turn push on for this phone or browser, then choose what to hear about.
export function NotificationSettings({ prefs: initial }: { prefs: NotificationPrefs | null }) {
  const [state, setState] = useState<DeviceState>("checking");
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial ?? { daily: true, friends: true, updates: true, email: false });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    void deviceState().then(setState);
  }, []);

  async function turnOn() {
    setBusy(true);
    setNote(null);
    const result = await turnOnPush();
    setState(result.state);
    if (result.error) setNote(result.error);
    setBusy(false);
  }

  async function turnOff() {
    setBusy(true);
    try {
      await turnOffPush();
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  function toggle(kind: keyof NotificationPrefs) {
    const was = prefs;
    const next = { ...prefs, [kind]: !prefs[kind] };
    setPrefs(next);
    startTransition(async () => {
      const r = await setNotificationPref(kind, next[kind]).catch(() => ({ error: "offline" }));
      if (r.error) setPrefs(was);
    });
  }

  async function test() {
    setNote(null);
    const { sent } = await sendTestPush().catch(() => ({ sent: 0 }));
    setNote(sent ? "Sent. It should show in a moment." : "Nothing was sent. Turn on at least one kind above.");
  }

  return (
    <section aria-labelledby="notifications" className="mt-6">
      <h2 id="notifications" className="mb-2 text-sm font-medium text-muted-foreground">
        Notifications
      </h2>
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center gap-3 px-4 py-3.5">
          {state === "on" ? <Bell className="size-5 text-primary" aria-hidden /> : <BellOff className="size-5 text-muted-foreground" aria-hidden />}
          <p className="min-w-0 flex-1 text-sm">
            {!KEY && "Notifications aren't set up on this server yet."}
            {KEY && state === "checking" && "Checking this device…"}
            {KEY && state === "on" && <span className="font-medium">On for this device</span>}
            {KEY && state === "off" && "Get a gentle reminder each morning, and hear when friends react."}
            {KEY && state === "blocked" && "Notifications are blocked for Kept. Allow them in your browser or phone settings, then come back."}
            {KEY && state === "ios-install" && "On iPhone, add Kept to your Home Screen first (Share → Add to Home Screen), then open it from there to turn these on."}
            {KEY && state === "unsupported" && "This browser can't show notifications."}
          </p>
          {KEY && (state === "off" || state === "on") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void (state === "on" ? turnOff() : turnOn())}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium disabled:opacity-60",
                state === "on" ? "border hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {state === "on" ? "Turn off" : "Turn on"}
            </button>
          )}
        </div>
        {KEY && state === "on" && (
          <ul className="divide-y border-t">
            {KINDS.map(({ kind, label, detail, soon }) => (
              <li key={kind} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{detail}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[kind]}
                  aria-label={label}
                  disabled={soon}
                  onClick={() => toggle(kind)}
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40",
                    prefs[kind] ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
                      prefs[kind] && "translate-x-5",
                    )}
                  />
                </button>
              </li>
            ))}
            <li className="px-4 py-3">
              <button type="button" onClick={() => void test()} className="text-sm font-medium text-primary hover:underline">
                Send a test notification
              </button>
            </li>
          </ul>
        )}
        {note && <p className="border-t px-4 py-2.5 text-sm text-muted-foreground">{note}</p>}
      </div>
    </section>
  );
}
