import type { Metadata } from "next";
import { Screen } from "@/components/screen";
import { VerseForm } from "@/components/verse-form";
import { requireUser } from "@/lib/auth";
import { isLookupTranslation } from "@/lib/bible/translations";
import { lastTranslation, listTags } from "@/lib/verses/queries";

export const metadata: Metadata = { title: "Add verse" };

// ?ref=John%203:16&t=MBBTAG pre-fills the form (used by the Bible reader).
export default async function NewVersePage({ searchParams }: PageProps<"/verses/new">) {
  const user = await requireUser();
  const sp = await searchParams;
  const [tags, translation] = await Promise.all([listTags(user.id), lastTranslation(user.id)]);

  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const t = typeof sp.t === "string" && isLookupTranslation(sp.t) ? sp.t : undefined;
  const fromBible = Boolean(ref);

  return (
    <Screen
      back={fromBible ? { href: "/bible", label: "Bible" } : { href: "/verses", label: "My verses" }}
      title="Add verse"
      className="pb-0"
    >
      <VerseForm
        allTags={tags}
        lastTranslation={t ?? translation}
        initial={fromBible ? { reference: ref, translation: t ?? "ESV", text: "", notes: "", tags: [] } : undefined}
      />
    </Screen>
  );
}
