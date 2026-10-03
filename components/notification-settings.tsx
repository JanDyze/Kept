"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2, Mail } from "lucide-react";
import { sendTestPush, setDailyHour, setNotificationPref } from "@/app/settings/notify-actions";
import { DEFAULT_DAILY_HOUR, hourLabel } from "@/lib/daily-time";
import { deviceState, PUSH_KEY, turnOffPush, turnOnPush, type DeviceState } from "@/lib/push-client";
import { cn } from "@/lib/utils";

export type NotificationPrefs = { daily: boolean; friends: boolean; updates: boolean; email: boolean; dailyHour: number };

const KEY = PUSH_KEY;

const KINDS: { kind: Exclude<keyof NotificationPrefs, "email" | "dailyHour">; label: string; detail: string }[] = [
  { kind: "daily", label: "Daily reminder", detail: "Today's verse and games" },
  { kind: "friends", label: "Friends", detail: "Reactions to your cards, and friend requests" },
  { kind: "updates", label: "What's new", detail: "When Kept gets something new" },
];

function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <span className={cn("absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
    </button>
  );
}

// Settings → Notifications: turn push on for this phone or browser, email on for the account,
// then choose what to hear about.
export function NotificationSettings({
  prefs: initial,
  email,
}: {
  prefs: NotificationPrefs | null;
  email: { ready: boolean; address: string | null }; // address null: a guest, no email to send to
}) {
  const [state, setState] = useState<DeviceState>("checking");
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial ?? { daily: true, friends: true, updates: true, email: true, dailyHour: DEFAULT_DAILY_HOUR });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
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

  function setHour(hour: number) {
    const was = prefs;
    setPrefs({ ...prefs, dailyHour: hour });
    startTransition(async () => {
      const r = await setDailyHour(hour, Intl.DateTimeFormat().resolvedOptions().timeZone).catch(() => ({ error: "offline" }));
      if (r.error) setPrefs(was);
    });
  }

  function toggle(kind: Exclude<keyof NotificationPrefs, "dailyHour">) {
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
    setTesting(true);
    const { lines } = await sendTestPush().catch(() => ({ sent: 0, lines: ["The test couldn't reach the server. Check your connection."] }));
    setTesting(false);
    setNote(lines.join("\n"));
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
        {email.ready && email.address && (
          <div className="flex items-center gap-3 border-t px-4 py-3">
            <Mail className={cn("size-5", prefs.email ? "text-primary" : "text-muted-foreground")} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Email</span>
              <span className="block truncate text-xs text-muted-foreground">To {email.address}</span>
            </span>
            <Switch on={prefs.email} label="Email" onToggle={() => toggle("email")} />
          </div>
        )}
        {((KEY && state === "on") || (email.ready && email.address && prefs.email)) && (
          <ul className="divide-y border-t">
            {KINDS.map(({ kind, label, detail }) => (
              <li key={kind} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {detail}
                    {kind === "daily" && (
                      <>
                        , at{" "}
                        {/* The hour, in this phone's time zone. */}
                        <select
                          value={prefs.dailyHour}
                          onChange={(e) => setHour(Number(e.target.value))}
                          aria-label="Time of the daily reminder"
                          className="rounded-md bg-muted px-1 py-0.5 text-base font-medium text-foreground md:text-xs"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {hourLabel(h)}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </span>
                </span>
                <Switch on={prefs[kind]} label={label} onToggle={() => toggle(kind)} />
              </li>
            ))}
            <li className="px-4 py-3">
              <button
                type="button"
                disabled={testing}
                onClick={() => void test()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-60"
              >
                {testing && <Loader2 className="size-4 animate-spin" aria-hidden />} Send a test notification
              </button>
            </li>
          </ul>
        )}
        {note && <p className="border-t px-4 py-2.5 text-sm whitespace-pre-line text-muted-foreground">{note}</p>}
      </div>
    </section>
  );
}
