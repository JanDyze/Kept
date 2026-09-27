import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Screen } from "@/components/screen";
import { VerseForm } from "@/components/verse-form";
import { requireUser } from "@/lib/auth";
import { getVerse, listTags } from "@/lib/verses/queries";

export const metadata: Metadata = { title: "Edit verse" };

export default async function EditVersePage({ params }: PageProps<"/verses/[id]/edit">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await requireUser();
  const [verse, tags] = await Promise.all([getVerse(user.id, id), listTags(user.id)]);
  if (!verse) notFound();

  return (
    <Screen back={{ href: `/verses/${verse.id}`, label: verse.reference }} title="Edit verse" className="pb-0">
      <VerseForm
        allTags={tags}
        initial={{
          id: verse.id,
          reference: verse.reference,
          translation: verse.translation,
          text: verse.text,
          notes: verse.notes ?? "",
          tags: verse.tags,
        }}
      />
    </Screen>
  );
}
