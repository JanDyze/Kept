import type { Metadata } from "next";
import { Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";
import { VerseForm } from "@/components/verse-form";
import { requireUser } from "@/lib/auth";
import { isLookupTranslation } from "@/lib/bible/translations";
import { lastTranslation, listTags, verseCounts } from "@/lib/verses/queries";
import { skipFirstVerse } from "../actions";

export const metadata: Metadata = { title: "Add verse" };

// ?ref=John%203:16&t=MBBTAG pre-fills the form (used by the Bible reader).
export default async function NewVersePage({ searchParams }: PageProps<"/verses/new">) {
  const user = await requireUser();
  const sp = await searchParams;
  const [tags, translation, counts] = await Promise.all([listTags(user.id), lastTranslation(user.id), verseCounts(user.id)]);

  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const t = typeof sp.t === "string" && isLookupTranslation(sp.t) ? sp.t : undefined;
  const fromBible = Boolean(ref);
  // A guest or someone with nothing kept yet may not have a verse in mind: they can skip for now.
  const canSkip = !fromBible && (user.guest || counts.active + counts.archived === 0);

  return (
    <Screen
      back={fromBible ? { href: "/bible", label: "Bible" } : { href: "/verses", label: "My verses" }}
      title="Add verse"
      action={
        canSkip && (
          <form action={skipFirstVerse}>
            <Button type="submit" variant="ghost" className="h-10 px-3 text-muted-foreground">
              Skip
            </Button>
          </form>
        )
      }
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
