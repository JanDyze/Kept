import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Where card photos' bytes live. Local disk for now (data/ is git-ignored); a serverless host has
// no lasting disk, so before deploying swap these three functions for object storage (e.g. Vercel
// Blob) keyed the same way. Keys look like "<userId>/<imageId>.jpg".
const ROOT = process.env.CARD_IMAGE_DIR ?? path.join(process.cwd(), "data", "card-images");

function fileFor(key: string) {
  const file = path.resolve(ROOT, key);
  if (!file.startsWith(path.resolve(ROOT) + path.sep)) throw new Error("Bad storage key");
  return file;
}

export async function putImage(key: string, bytes: Uint8Array) {
  const file = fileFor(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export async function getImage(key: string): Promise<Uint8Array | null> {
  try {
    return await readFile(fileFor(key));
  } catch {
    return null;
  }
}

export async function deleteImage(key: string) {
  await rm(fileFor(key), { force: true });
}
