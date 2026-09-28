import { getSharedPhoto } from "@/lib/cards/share";

// The photo behind a shared card. Cached only briefly, so stopping sharing takes effect soon.
export async function GET(_request: Request, ctx: RouteContext<"/s/[token]/photo">) {
  const { token } = await ctx.params;
  const photo = await getSharedPhoto(token);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(photo.bytes as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
