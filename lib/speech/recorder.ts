// Say it's recorder, for the browser. The mic stays open from Start to Done and Kept listens for
// the pauses itself: each phrase, cut where the speaker stops for a moment, goes to
// /api/transcribe (Whisper) as 16 kHz samples, and its words come back while the next phrase is
// being said. (The phone's own speech recognition turns itself off, with a sound, at every pause
// on Android.)

type AudioContextClass = typeof AudioContext;
export function audioContextClass() {
  const w = window as unknown as { AudioContext?: AudioContextClass; webkitAudioContext?: AudioContextClass };
  return w.AudioContext ?? w.webkitAudioContext;
}

const RATE = 16_000;
const PAUSE_MS = 650; // this much quiet ends a phrase
const MIN_SPEECH_MS = 250; // shorter bursts are a cough or a tap, not a word
const PRE_ROLL_MS = 300; // kept from before the voice starts, so the first sound isn't clipped
const LONG_MS = 8_000; // past this, a shorter pause will do
const MAX_MS = 15_000;

// Averages each run of samples down to 16 kHz, as 16-bit.
export function toPcm16(frames: Float32Array[], rate: number) {
  const input = new Float32Array(frames.reduce((n, f) => n + f.length, 0));
  let at = 0;
  for (const f of frames) {
    input.set(f, at);
    at += f.length;
  }
  const step = rate / RATE;
  const out = new Int16Array(Math.floor(input.length / step));
  for (let i = 0; i < out.length; i++) {
    const from = Math.floor(i * step);
    const to = Math.max(from + 1, Math.floor((i + 1) * step));
    let sum = 0;
    for (let j = from; j < to; j++) sum += input[j];
    const v = Math.max(-1, Math.min(1, sum / (to - from)));
    out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return out;
}

export type Session = { stop: () => void; flush: () => void; done: () => Promise<{ text: string; failed: boolean; spoke: boolean }> };

export function record(stream: MediaStream, lang: "en" | "tl", onText: (text: string) => void): Session {
  const Ctx = audioContextClass()!;
  const ctx = new Ctx();
  void ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const rate = ctx.sampleRate;

  const parts: string[] = [];
  let failed = false;
  let spoke = false;
  let queue = Promise.resolve();
  const send = (frames: Float32Array[]) => {
    const index = parts.push("") - 1;
    const pcm = toPcm16(frames, rate);
    spoke = true;
    // One phrase at a time, in order, so a cold server loads the model once.
    queue = queue.then(async () => {
      try {
        const res = await fetch(`/api/transcribe?lang=${lang}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: pcm.buffer as ArrayBuffer,
        });
        if (!res.ok) throw new Error(String(res.status));
        parts[index] = ((await res.json()) as { text: string }).text;
        onText(parts.filter(Boolean).join(" "));
      } catch {
        failed = true;
      }
    });
  };

  // The room's own level: drops straight to any quieter moment (the gaps between words) and creeps
  // up otherwise. It starts low rather than at the first sound, which is often the first word.
  let floor = 0.003;
  let preRoll: Float32Array[] = [];
  let phrase: Float32Array[] | null = null;
  let phraseMs = 0;
  let speechMs = 0;
  let quietMs = 0;
  const cut = () => {
    if (phrase && speechMs >= MIN_SPEECH_MS) send(phrase);
    phrase = null;
    preRoll = [];
  };

  processor.onaudioprocess = (e) => {
    const frame = new Float32Array(e.inputBuffer.getChannelData(0)); // the browser reuses its buffer
    const ms = (frame.length / rate) * 1000;
    let sum = 0;
    for (const v of frame) sum += v * v;
    const level = Math.sqrt(sum / frame.length);
    floor = level < floor ? level : floor + (level - floor) * 0.01; // a steady voice stays voice for seconds
    const voice = level > Math.max(0.01, floor * 2.5);

    if (!phrase) {
      preRoll.push(frame);
      while (preRoll.length > 1 && ((preRoll.length - 1) * frame.length * 1000) / rate > PRE_ROLL_MS) preRoll.shift();
      if (voice) {
        phrase = preRoll;
        preRoll = [];
        phraseMs = speechMs = ms;
        quietMs = 0;
      }
      return;
    }
    phrase.push(frame);
    phraseMs += ms;
    if (voice) {
      speechMs += ms;
      quietMs = 0;
    } else quietMs += ms;
    if (quietMs >= PAUSE_MS || (phraseMs >= LONG_MS && quietMs >= PAUSE_MS / 3) || phraseMs >= MAX_MS) cut();
  };
  source.connect(processor);
  processor.connect(ctx.destination); // Chrome only runs the processor when it's connected

  const stop = () => {
    processor.onaudioprocess = null;
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
  return {
    stop,
    flush: cut,
    done: async () => {
      await queue;
      return { text: parts.filter(Boolean).join(" "), failed, spoke };
    },
  };
}
