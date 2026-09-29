import type { Metadata } from "next";
import Image from "next/image";
import { Download, HandHeart } from "lucide-react";
import { Screen } from "@/components/screen";
import { GiveLink, ShareKept } from "@/components/support-kept";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Support Kept" };

// Not listed anywhere: it opens from the Kept logo at the foot of Settings, for whoever goes looking.
// Giving is configured by env: SUPPORT_QR (a /public path or full URL) shows a GCash code with Save
// QR (a phone can't scan its own screen, so it's saved and uploaded in GCash instead), SUPPORT_URL
// adds a Give link (Ko-fi, ...). Sharing always shows.
export default async function SupportPage() {
  await requireUser();
  const url = process.env.SUPPORT_URL?.trim() || null;
  const qr = process.env.SUPPORT_QR?.trim() || null;
  const qrLabel = process.env.SUPPORT_QR_LABEL?.trim() || "GCash";

  return (
    <Screen back={{ href: "/settings", label: "Settings" }} title="Support Kept">
      <section className="flex flex-col items-center rounded-2xl border bg-card px-5 pt-7 pb-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-icon-tile">
          <HandHeart className="size-6 text-icon-ink" aria-hidden />
        </span>
        <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">
          Kept is free, with no ads. Tips help pay for the servers and new features.
        </p>

        {qr && (
          <figure className="mt-6 w-full max-w-64">
            <Image
              src={qr}
              alt={`${qrLabel} QR code`}
              width={256}
              height={256}
              unoptimized
              className="aspect-square w-full rounded-2xl border bg-white object-contain"
            />
            <figcaption className="mt-2.5 text-sm font-medium text-muted-foreground">{qrLabel}</figcaption>
          </figure>
        )}

        {(qr || url) && (
          <div className="mt-5 flex w-full flex-col gap-2">
            {qr && (
              <GiveLink href={qr} download="kept-gcash-qr.png">
                <Download className="size-4" aria-hidden /> Save QR
              </GiveLink>
            )}
            {url && (
              <GiveLink href={url} variant={qr ? "outline" : "primary"}>
                <HandHeart className="size-4" aria-hidden /> Give
              </GiveLink>
            )}
          </div>
        )}
      </section>

      <div className="mt-3">
        <ShareKept />
      </div>
    </Screen>
  );
}
