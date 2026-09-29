"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { audioContextClass, record, type Session } from "@/lib/speech/recorder";

// Say it's microphone, as a hook: start, finish, and what's been heard so far (lib/speech/recorder).

const noop = () => () => {};
// Whether this browser can record: null while rendering on the server.
export function useCanRecord() {
  return useSyncExternalStore(
    noop,
    () => Boolean(window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === "function" && audioContextClass()),
    () => null,
  );
}

const MIC_ERRORS: Record<string, string> = {
  NotAllowedError: "Allow the microphone to play.",
  SecurityError: "Allow the microphone to play.",
  NotFoundError: "No microphone found.",
  NotReadableError: "The microphone is busy. Close other apps using it.",
};

// listening: the mic is open. checking: Done was tapped and the last phrase is on its way.
// onDone gets everything said, once, when a try ends with words in it.
export function useVoice({ lang, onDone }: { lang: "en" | "tl"; onDone: (text: string) => void }) {
  const [phase, setPhase] = useState<"idle" | "starting" | "listening" | "checking">("idle");
  const [heard, setHeard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const session = useRef<Session | null>(null);
  const live = useRef(true);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    live.current = true;
    // Load the speech model now, so the first phrase doesn't wait for it.
    void fetch(`/api/transcribe?lang=${lang}`, { method: "POST" }).catch(() => {});
    // Leaving mid-recitation drops it rather than counting it as a try.
    return () => {
      live.current = false;
      session.current?.stop();
      session.current = null;
    };
  }, [lang]);

  async function start() {
    if (phase !== "idle") return;
    setPhase("starting");
    setError(null);
    setHeard("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      if (!live.current) return stream.getTracks().forEach((t) => t.stop());
      session.current = record(stream, lang, (text) => live.current && setHeard(text));
      setPhase("listening");
    } catch (e) {
      setError(MIC_ERRORS[(e as Error).name] ?? "Couldn't use the microphone. Try again.");
      setPhase("idle");
    }
  }

  async function finish() {
    const s = session.current;
    if (!s || phase !== "listening") return;
    setPhase("checking");
    s.flush();
    s.stop();
    const { text, failed, spoke } = await s.done();
    if (!live.current) return;
    session.current = null;
    setPhase("idle");
    setHeard("");
    // A phrase lost on the way (a dropped connection) would be graded as words missed; it doesn't
    // cost a try.
    if (failed) setError("Couldn't make out the words. Try again.");
    else if (text.trim()) done.current(text);
    else setError(spoke ? "Didn't catch any words. Try again." : "Didn't hear anything. Try again.");
  }

  return { phase, heard, error, start, finish };
}
