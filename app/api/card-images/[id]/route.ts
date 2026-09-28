import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { deleteCardImage, findCardImage } from "@/lib/cards/images";
import { getImage } from "@/lib/cards/storage";
import { canSeeCardImage } from "@/lib/social/gallery";

const idSchema = z.uuid();

// A card photo: for the user who uploaded it, and for anyone shown a card that uses it (a friend's
// "friends" card, anyone's "everyone" card). Photos never change, so the owner's browser keeps them;
// others re-check within the hour, in case the card goes private.
export async function GET(_request: Request, ctx: RouteContext<"/api/card-images/[id]">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  if (!idSchema.safeParse(id).success) return new Response(null, { status: 404 });

  const row = await findCardImage(id);
  if (!row || !(await canSeeCardImage(user.id, row.userId, id))) return new Response(null, { status: 404 });
  const bytes = await getImage(row.storageKey);
  if (!bytes) return new Response(null, { status: 404 });

  return new Response(bytes as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": row.userId === user.id ? "private, max-age=31536000, immutable" : "private, max-age=3600",
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
