import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CardEditor } from "@/components/card-editor";
import { Screen } from "@/components/screen";
import { requireUser } from "@/lib/auth";
import { bookByName } from "@/lib/bible/books";
import { listCardImages } from "@/lib/cards/images";
import { readCardStyle } from "@/lib/cards/style";
import { getVerse } from "@/lib/verses/queries";

export const metadata: Metadata = { title: "Card" };

export default async function CardPage({ params }: PageProps<"/verses/[id]/card">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await requireUser();
  const [verse, images] = await Promise.all([getVerse(user.id, id), listCardImages(user.id)]);
  if (!verse || verse.archivedAt) notFound();

  const tagalog = verse.translation === "MBBTAG" ? bookByName(verse.book)?.tl : undefined;

  return (
    <Screen back={{ href: `/verses/${verse.id}`, label: verse.reference }} title="Card" className="pb-0">
      <CardEditor
        verseId={verse.id}
        reference={tagalog ? verse.reference.replace(verse.book, tagalog) : verse.reference}
        translation={verse.translation}
        text={verse.text}
        saved={readCardStyle(verse.card)}
        images={images.map((i) => i.id)}
      />
    </Screen>
  );
}
