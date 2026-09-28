import { getUser } from "@/lib/auth";
import { sniffImage } from "@/lib/cards/images";
import { getImage } from "@/lib/cards/storage";

// A profile picture someone uploaded, for anyone signed in (profiles are visible to everyone).
export async function GET(_request: Request, ctx: RouteContext<"/api/avatars/[userId]/[file]">) {
  const { userId, file } = await ctx.params;
  if (!(await getUser())) return new Response(null, { status: 401 });
  if (!/^[\w-]+$/.test(userId) || !/^[\w-]+\.(jpg|png|webp)$/.test(file)) return new Response(null, { status: 404 });
  const bytes = await getImage(`avatars/${userId}/${file}`);
  const kind = bytes && sniffImage(bytes);
  if (!bytes || !kind) return new Response(null, { status: 404 });
  return new Response(bytes as Uint8Array<ArrayBuffer>, {
    headers: { "Content-Type": kind.type, "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
