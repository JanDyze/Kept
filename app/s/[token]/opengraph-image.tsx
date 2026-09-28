import { ImageResponse } from "next/og";
import { bookByName } from "@/lib/bible/books";
import { getSharedCard, getSharedPhoto } from "@/lib/cards/share";
import { cardColors } from "@/lib/cards/style";

// The picture chat apps show for a shared card link: its colors or photo, the verse, the reference.
export const alt = "A verse card from Kept";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shared = await getSharedCard(token);
  if (!shared) return new Response(null, { status: 404 });

  const bg = shared.style?.bg ?? { kind: "theme" as const };
  const colors = shared.style ? cardColors(bg, shared.style.text) : {};
  const photo = bg.kind === "image" ? await getSharedPhoto(token) : null;
  const tl = shared.translation === "MBBTAG" ? bookByName(shared.book)?.tl : undefined;
  const reference = tl ? shared.reference.replace(shared.book, tl) : shared.reference;
  const text = shared.text.length > 320 ? `${shared.text.slice(0, 317).trimEnd()}…` : shared.text;
  const fontSize = text.length < 90 ? 64 : text.length < 160 ? 52 : text.length < 260 ? 42 : 36;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: colors.bg ?? "#fbf8f2",
          color: colors.fg ?? "#23211c",
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- rendered to an image, not a page
          <img
            src={`data:${photo.contentType};base64,${Buffer.from(photo.bytes).toString("base64")}`}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {bg.kind === "image" && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${(bg.dim + 10) / 100})` }} />
        )}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            padding: "70px 110px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize, lineHeight: 1.35 }}>{text}</div>
          <div style={{ marginTop: 44, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", opacity: 0.75 }}>
            {`${reference} · ${shared.translation}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
