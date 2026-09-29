import { afterEach, describe, expect, it, vi } from "vitest";
import { record, toPcm16 } from "./recorder";

const RATE = 48_000;
const FRAME = 4096;

// A stand-in for the browser's audio graph: the test plays samples into the recorder's processor.
function fakeAudio() {
  const processor: { onaudioprocess: ((e: unknown) => void) | null; connect(): void; disconnect(): void } = {
    onaudioprocess: null,
    connect() {},
    disconnect() {},
  };
  class Ctx {
    sampleRate = RATE;
    destination = {};
    resume = async () => {};
    close = async () => {};
    createMediaStreamSource = () => ({ connect() {}, disconnect() {} });
    createScriptProcessor = () => processor;
  }
  vi.stubGlobal("window", { AudioContext: Ctx });
  const play = (samples: Float32Array) => {
    for (let i = 0; i < samples.length; i += FRAME) {
      const frame = samples.slice(i, i + FRAME);
      processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => frame } });
    }
  };
  return { play };
}

// Voice as a tone, silence as faint noise.
const tone = (ms: number) => Float32Array.from({ length: (RATE * ms) / 1000 }, (_, i) => 0.3 * Math.sin((2 * Math.PI * 220 * i) / RATE));
const quiet = (ms: number) => Float32Array.from({ length: (RATE * ms) / 1000 }, () => (Math.random() * 2 - 1) * 0.002);
const join = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  parts.reduce((at, p) => (out.set(p, at), at + p.length), 0);
  return out;
};

// The server, answering each phrase with its length in tenths of a second.
function fakeServer() {
  const phrases: number[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: { body: ArrayBuffer }) => {
    const seconds = init.body.byteLength / 2 / 16_000;
    phrases.push(seconds);
    return { ok: true, json: async () => ({ text: `p${Math.round(seconds * 10)}` }) };
  });
  return phrases;
}

const stream = { getTracks: () => [{ stop() {} }] } as unknown as MediaStream;

afterEach(() => vi.unstubAllGlobals());

describe("toPcm16", () => {
  it("brings 48 kHz down to 16 kHz", () => {
    const pcm = toPcm16([new Float32Array(4800).fill(0.5)], 48_000);
    expect(pcm.length).toBe(1600);
    expect(Math.abs(pcm[0] - 0.5 * 0x7fff)).toBeLessThanOrEqual(1); // 0.5 in 16-bit
  });
});

describe("record", () => {
  it("sends each phrase when the speaker pauses, in order", async () => {
    const { play } = fakeAudio();
    const phrases = fakeServer();
    const heard: string[] = [];
    const s = record(stream, "en", (text) => heard.push(text));
    play(join(quiet(500), tone(2000), quiet(1000), tone(1500), quiet(1000), tone(1000)));
    s.flush();
    s.stop();
    const { text, failed } = await s.done();
    expect(phrases).toHaveLength(3);
    // Each phrase whole: its voice, a moment before it, and the pause that ended it (the last one
    // is cut by Done instead).
    expect(phrases[0]).toBeGreaterThan(2.6);
    expect(phrases[1]).toBeGreaterThan(2.1);
    expect(phrases[2]).toBeGreaterThan(1.0);
    expect(failed).toBe(false);
    expect(text.split(" ")).toHaveLength(3);
    expect(heard.at(-1)).toBe(text);
  });

  it("doesn't cut a long, steady phrase", async () => {
    const { play } = fakeAudio();
    const phrases = fakeServer();
    const s = record(stream, "en", () => {});
    play(join(quiet(500), tone(3500), quiet(1000)));
    s.flush();
    s.stop();
    await s.done();
    expect(phrases).toHaveLength(1);
  });

  it("keeps a short breath inside the phrase", async () => {
    const { play } = fakeAudio();
    const phrases = fakeServer();
    const s = record(stream, "en", () => {});
    play(join(tone(1500), quiet(300), tone(1500), quiet(1000)));
    s.flush();
    s.stop();
    await s.done();
    expect(phrases).toHaveLength(1);
  });

  it("sends nothing for silence or a click", async () => {
    const { play } = fakeAudio();
    const phrases = fakeServer();
    const s = record(stream, "en", () => {});
    play(join(quiet(2000), tone(100), quiet(2000)));
    s.flush();
    s.stop();
    const { spoke } = await s.done();
    expect(phrases).toHaveLength(0);
    expect(spoke).toBe(false);
  });

  it("says when a phrase didn't make it", async () => {
    const { play } = fakeAudio();
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 500 }));
    const s = record(stream, "en", () => {});
    play(join(tone(1000), quiet(1000)));
    s.flush();
    s.stop();
    expect((await s.done()).failed).toBe(true);
  });
});
