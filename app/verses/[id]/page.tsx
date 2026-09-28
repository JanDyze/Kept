import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, Palette, Pencil } from "lucide-react";
import { z } from "zod";
import { MemoryCard } from "@/components/memory-card";
import { TagChip } from "@/components/tag-chip";
import { VerseNotes } from "@/components/verse-notes";
import { Morph, morphName } from "@/components/verse-morph";
import { Screen } from "@/components/screen";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { bookByName } from "@/lib/bible/books";
import { readCardStyle } from "@/lib/cards/style";
import { formatDate } from "@/lib/format";
import { getTimeZone } from "@/lib/day";
import { listNotes } from "@/lib/verses/notes";
import { getVerse } from "@/lib/verses/queries";
import { cn } from "@/lib/utils";
import { setArchived } from "../actions";

export async function generateMetadata({ params }: PageProps<"/verses/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return {};
  const user = await requireUser();
  const verse = await getVerse(user.id, id);
  return { title: verse?.reference };
}

export default async function VersePage({ params }: PageProps<"/verses/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await requireUser();
  const verse = await getVerse(user.id, id);
  if (!verse) notFound();

  const notes = await listNotes(user.id, verse.id, await getTimeZone());
  const archived = Boolean(verse.archivedAt);
  const card = readCardStyle(verse.card);
  const tagalog = verse.translation === "MBBTAG" ? bookByName(verse.book)?.tl : undefined;
  const localRef = tagalog ? verse.reference.replace(verse.book, tagalog) : null;

  return (
    <Screen
      back={archived ? { href: "/verses?view=archived", label: "Archived" } : { href: "/verses", label: "My verses" }}
      action={
        !archived && (
          <Link
            href={`/verses/${verse.id}/edit`}
            transitionTypes={["nav-forward"]}
            className={cn(buttonVariants({ variant: "ghost" }), "h-10 gap-1.5")}
          >
            <Pencil className="size-4" aria-hidden /> Edit
          </Link>
        )
      }
    >
      <article>
        {card ? (
          <>
            <h1 className="sr-only">{verse.reference}</h1>
            {archived && <Badge variant="outline" className="mb-3">Archived</Badge>}
            <MemoryCard
              style={card}
              reference={localRef ?? verse.reference}
              translation={verse.translation}
              text={verse.text}
              morphId={verse.id}
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{verse.translation}</Badge>
              {archived && <Badge variant="outline">Archived</Badge>}
            </div>
            <Morph name={morphName.reference(verse.id)}>
              <h1 className="mt-3 w-fit font-brand text-3xl font-semibold tracking-tight">{verse.reference}</h1>
            </Morph>
            {localRef && <p className="text-muted-foreground">{localRef}</p>}

            <Morph name={morphName.text(verse.id)}>
              <p className="mt-5 whitespace-pre-line font-serif text-[1.35rem] leading-relaxed">{verse.text}</p>
            </Morph>
          </>
        )}

        {!archived && (
          <Link
            href={`/verses/${verse.id}/card`}
            transitionTypes={["nav-forward"]}
            className={cn(
              "mt-4 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium text-muted-foreground",
              "transition-colors hover:bg-muted hover:text-foreground",
            )}
          >
            <Palette className="size-4" aria-hidden /> {card ? "Edit card" : "Make it a card"}
          </Link>
        )}

        {verse.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tags">
            {verse.tags.map((t) => (
              <li key={t}>
                <TagChip tag={t} href={`/verses?tag=${encodeURIComponent(t)}`} />
              </li>
            ))}
          </ul>
        )}

        <VerseNotes verseId={verse.id} initial={notes} readOnly={archived} />
      </article>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-10 text-sm text-muted-foreground">
        <span>Added {formatDate(verse.createdAt)}</span>
        <form action={setArchived.bind(null, verse.id, !archived)}>
          <SubmitButton variant="ghost" className="h-10 gap-1.5 text-muted-foreground">
            {archived ? (
              <>
                <ArchiveRestore className="size-4" aria-hidden /> Restore
              </>
            ) : (
              <>
                <Archive className="size-4" aria-hidden /> Archive
              </>
            )}
          </SubmitButton>
        </form>
      </footer>
    </Screen>
  );
}
