import { getUser } from "@/lib/auth";
import { MAX_SECONDS, SAMPLE_RATE, speechModel, transcribe } from "@/lib/speech/transcribe";

// The first phrase after a cold start waits for the model to download and load.
export const maxDuration = 60;

// One spoken phrase from Say it: 16-bit mono samples at 16 kHz in the body, ?lang=en|tl.
// An empty body just loads the model, sent when the game opens so the first phrase isn't slow.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) {
    await speechModel();
    return new Response(null, { status: 204 });
  }
  if (bytes.byteLength % 2 || bytes.byteLength > MAX_SECONDS * SAMPLE_RATE * 2) return new Response(null, { status: 413 });
  const lang = new URL(request.url).searchParams.get("lang") === "tl" ? "tl" : "en";
  try {
    return Response.json({ text: await transcribe(new Int16Array(bytes), lang) });
  } catch (e) {
    console.error("transcribe failed", e);
    return new Response(null, { status: 500 });
  }
}
