import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { deleteCardImage, getCardImage } from "@/lib/cards/images";
import { getImage } from "@/lib/cards/storage";

const idSchema = z.uuid();

// A card photo, only for the user who uploaded it. Photos never change, so the browser keeps them.
export async function GET(_request: Request, ctx: RouteContext<"/api/card-images/[id]">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  if (!idSchema.safeParse(id).success) return new Response(null, { status: 404 });

  const row = await getCardImage(user.id, id);
  const bytes = row && (await getImage(row.storageKey));
  if (!row || !bytes) return new Response(null, { status: 404 });

  return new Response(bytes as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/card-images/[id]">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  if (!idSchema.safeParse(id).success || !(await deleteCardImage(user.id, id))) return new Response(null, { status: 404 });

  revalidatePath("/verses", "layout");
  return new Response(null, { status: 204 });
}
