"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { removePushSubscription, savePushSubscription, sendTestPush, setNotificationPref } from "@/app/settings/notify-actions";
import { cn } from "@/lib/utils";

export type NotificationPrefs = { daily: boolean; friends: boolean; updates: boolean; email: boolean };

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const KINDS: { kind: keyof NotificationPrefs; label: string; detail: string; soon?: boolean }[] = [
  { kind: "daily", label: "Morning reminder", detail: "Today's verse and games, at 8 each morning" },
  { kind: "friends", label: "Friends", detail: "Reactions to your cards, and friend requests" },
  { kind: "updates", label: "What's new", detail: "When Kept gets something new" },
  { kind: "email", label: "Email too", detail: "The same by email — coming soon", soon: true },
];

type DeviceState = "checking" | "unsupported" | "ios-install" | "blocked" | "off" | "on";

function base64ToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

// Settings → Notifications: turn push on for this phone or browser, then choose what to hear about.
export function NotificationSettings({ prefs: initial }: { prefs: NotificationPrefs | null }) {
  const [state, setState] = useState<DeviceState>("checking");
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial ?? { daily: true, friends: true, updates: true, email: false });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const installed = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    let next: Promise<DeviceState>;
    if (!supported) next = Promise.resolve(ios && !installed ? "ios-install" : "unsupported");
    else if (Notification.permission === "denied") next = Promise.resolve("blocked");
    else
      next = navigator.serviceWorker
        .getRegistration("/")
        .then((reg) => reg?.pushManager.getSubscription())
        .then((sub): DeviceState => (sub ? "on" : "off"))
        .catch((): DeviceState => "off");
    void next.then(setState);
  }, []);

  async function turnOn() {
    setBusy(true);
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(KEY) }));
      const result = await savePushSubscription(sub.toJSON(), Intl.DateTimeFormat().resolvedOptions().timeZone);
      if (result.error) setNote(result.error);
      else setState("on");
    } catch {
      setNote("Notifications couldn't be turned on here. Try again, or from the installed app.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
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
