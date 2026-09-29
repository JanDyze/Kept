import type { Metadata } from "next";
import Image from "next/image";
import { HandHeart } from "lucide-react";
import { Screen } from "@/components/screen";
import { GiveLink, ShareKept } from "@/components/support-kept";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Support Kept" };

// Giving is optional and configured by env: SUPPORT_URL (Ko-fi, PayPal.me, ...) for the Give
// button, SUPPORT_QR (a /public path or full URL) for a GCash or Maya code. Sharing always shows.
export default async function SupportPage() {
  await requireUser();
  const url = process.env.SUPPORT_URL?.trim() || null;
  const qr = process.env.SUPPORT_QR?.trim() || null;
  const qrLabel = process.env.SUPPORT_QR_LABEL?.trim() || "GCash or Maya";

  return (
    <Screen back={{ href: "/settings", label: "Settings" }} title="Support Kept">
      <section className="flex flex-col items-center rounded-2xl border bg-card px-5 py-7 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-icon-tile">
          <HandHeart className="size-7 text-icon-ink" aria-hidden />
        </span>
        <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
          Kept is free, with no ads. Tips help pay for the servers and new features.
        </p>
        {url && (
          <GiveLink href={url} className="mt-5">
            <HandHeart className="size-4" aria-hidden /> Give
          </GiveLink>
        )}
      </section>

      {qr && (
        <section aria-labelledby="qr" className="mt-4 flex flex-col items-center rounded-2xl border bg-card px-5 py-6">
          <h2 id="qr" className="text-sm font-medium text-muted-foreground">
            {qrLabel}
          </h2>
          <Image
            src={qr}
            alt={`${qrLabel} QR code`}
            width={224}
            height={224}
            unoptimized
            className="mt-3 size-56 rounded-xl bg-white object-contain p-2"
          />
        </section>
      )}

      <div className="mt-4">
        <ShareKept />
      </div>
    </Screen>
  );
}
