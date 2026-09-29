import { getUser, GUEST_NOT_ALLOWED } from "@/lib/auth";
import { MAX_IMAGE_BYTES, saveCardImage } from "@/lib/cards/images";
import { cardImageUrl } from "@/lib/cards/style";

// Upload a card photo (multipart field "file"). The editor shrinks it in the browser first, so
// this mostly guards against oversized or non-image files.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Sign in again." }, { status: 401 });
  if (user.guest) return Response.json({ error: GUEST_NOT_ALLOWED }, { status: 403 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_IMAGE_BYTES + 64 * 1024) return Response.json({ error: "That photo is too large." }, { status: 413 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return Response.json({ error: "Choose a photo." }, { status: 400 });

  const result = await saveCardImage(user.id, new Uint8Array(await file.arrayBuffer()));
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ id: result.id, url: cardImageUrl(result.id) }, { status: 201 });
}
