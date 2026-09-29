import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

// Where card photos' and uploaded avatars' bytes live, keyed like "<userId>/<imageId>.jpg" or
// "avatars/<userId>/<file>". A private Vercel Blob store (every read goes through our routes,
// which check who may see it) when CARD_STORAGE=blob and BLOB_READ_WRITE_TOKEN are set; otherwise
// local disk under data/ (git-ignored), for a dev machine without a store.
const useBlob = process.env.CARD_STORAGE === "blob" && Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const ROOT = process.env.CARD_IMAGE_DIR ?? path.join(process.cwd(), "data", "card-images");

function fileFor(key: string) {
  const file = path.resolve(ROOT, key);
  if (!file.startsWith(path.resolve(ROOT) + path.sep)) throw new Error("Bad storage key");
  return file;
}

function checkKey(key: string) {
  if (!/^[\w-]+(\/[\w-]+)*\.\w+$/.test(key)) throw new Error("Bad storage key");
  return key;
}

const contentType = (key: string) =>
  key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";

export async function putImage(key: string, bytes: Uint8Array) {
  if (useBlob) {
    await put(checkKey(key), Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentType(key),
    });
    return;
  }
  const file = fileFor(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export async function getImage(key: string): Promise<Uint8Array | null> {
  try {
    if (useBlob) {
      const found = await get(checkKey(key), { access: "private" });
      if (!found || found.statusCode !== 200) return null;
      return new Uint8Array(await new Response(found.stream).arrayBuffer());
    }
    return await readFile(fileFor(key));
  } catch {
    return null;
  }
}

export async function deleteImage(key: string) {
  if (useBlob) {
    await del(checkKey(key));
    return;
  }
  await rm(fileFor(key), { force: true });
}
