// Turning push on and off on this device (browser side), shared by Settings → Notifications and
// the first-visit prompt. The server keeps the subscription (app/settings/notify-actions.ts).
import { removePushSubscription, savePushSubscription } from "@/app/settings/notify-actions";

export const PUSH_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type DeviceState = "checking" | "unconfigured" | "unsupported" | "ios-install" | "blocked" | "off" | "on";

function base64ToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

// Where this device stands: can it take notifications, and is it already?
export async function deviceState(): Promise<DeviceState> {
  if (!PUSH_KEY) return "unconfigured";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const installed = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) return ios && !installed ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try {
    const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
    return sub ? "on" : "off";
  } catch {
    return "off";
  }
}

// Asks the browser (must run from a tap), subscribes, and saves it. Returns the new state, or an error.
export async function turnOnPush(): Promise<{ state: DeviceState; error?: string }> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { state: permission === "denied" ? "blocked" : "off" };
    const reg = await registration();
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(PUSH_KEY) }));
    const result = await savePushSubscription(sub.toJSON(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return result.error ? { state: "off", error: result.error } : { state: "on" };
  } catch {
    return { state: "off", error: "Notifications couldn't be turned on here. Try again, or from the installed app." };
  }
}

export async function turnOffPush() {
  const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
  if (sub) {
    await removePushSubscription(sub.endpoint);
    await sub.unsubscribe();
  }
}
