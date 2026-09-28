import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { sniffImage } from "@/lib/cards/images";
import { putImage } from "@/lib/cards/storage";
import { removeUploadedAvatar } from "@/lib/social/avatars";
import { setAvatar } from "@/lib/social/profiles";

// Your profile picture: upload a new one (already cropped and shrunk in the browser), or remove it.
// Files live beside card photos under avatars/<userId>/, named fresh each time so they cache forever.
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Sign in again." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return Response.json({ error: "Choose a photo." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return Response.json({ error: "That photo is too large." }, { status: 413 });
  const kind = sniffImage(bytes);
  if (!kind) return Response.json({ error: "Use a JPEG, PNG or WebP photo." }, { status: 415 });

  const name = `${crypto.randomUUID()}.${kind.ext}`;
  await putImage(`avatars/${user.id}/${name}`, bytes);
  await removeUploadedAvatar(user.id);
  const url = `/api/avatars/${user.id}/${name}`;
  await setAvatar(user.id, url);
  revalidatePath("/", "layout");
  return Response.json({ url }, { status: 201 });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  await removeUploadedAvatar(user.id);
  await setAvatar(user.id, null);
  revalidatePath("/", "layout");
  return new Response(null, { status: 204 });
}
