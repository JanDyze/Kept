import "server-only";

// Say it's ears: Whisper (free from Hugging Face, run here with Transformers.js like the games'
// word model, no API or key). The phone's own speech recognition beeps off and on at every pause
// on Android, so the game records the mic itself and sends each phrase here as 16 kHz samples.
// whisper-base (multilingual, ~80 MB) reads English and Tagalog; small was twice as slow.

export const SAMPLE_RATE = 16_000;
export const MAX_SECONDS = 30; // a phrase; the recorder cuts long ones well before this

type Asr = (audio: Float32Array, opts: { language: string; task: "transcribe" }) => Promise<{ text: string }>;
let loading: Promise<Asr> | null = null;

export function speechModel() {
  if (!loading) {
    loading = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      // A serverless host can only write to /tmp; locally the download stays in node_modules/.cache.
      if (process.env.VERCEL) env.cacheDir = "/tmp/hf";
      return (await pipeline("automatic-speech-recognition", "onnx-community/whisper-base", { dtype: "q8" })) as unknown as Asr;
    })();
    loading.catch(() => (loading = null));
  }
  return loading;
}

// Whisper fills silence and noise with stock phrases from its training subtitles.
const HALLUCINATIONS = new Set(["you", "thank you", "thanks for watching", "thank you for watching", "bye", "salamat po"]);

export async function transcribe(pcm: Int16Array, lang: "en" | "tl") {
  const audio = Float32Array.from(pcm, (v) => v / 32768);
  const asr = await speechModel();
  const { text } = await asr(audio, { language: lang === "tl" ? "tagalog" : "english", task: "transcribe" });
  const said = text.trim();
  return HALLUCINATIONS.has(said.toLowerCase().replace(/[^\p{L} ]/gu, "").trim()) ? "" : said;
}
