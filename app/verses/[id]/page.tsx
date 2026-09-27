import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, Palette, Pencil } from "lucide-react";
import { z } from "zod";
import { MemoryCard } from "@/components/memory-card";
import { Screen } from "@/components/screen";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { bookByName } from "@/lib/bible/books";
import { readCardStyle } from "@/lib/cards/style";
import { formatDate } from "@/lib/format";
import { getVerse } from "@/lib/verses/queries";
import { tagLabel } from "@/lib/verses/tag-label";
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
              className="animate-rise"
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{verse.translation}</Badge>
              {archived && <Badge variant="outline">Archived</Badge>}
            </div>
            <h1 className="mt-3 font-brand text-3xl font-semibold tracking-tight">{verse.reference}</h1>
            {localRef && <p className="text-muted-foreground">{localRef}</p>}

            <p className="mt-5 whitespace-pre-line font-serif text-[1.35rem] leading-relaxed">{verse.text}</p>
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
          <div className="mt-4 flex flex-wrap gap-2">
            {verse.tags.map((t) => (
              <Link
                key={t}
                href={`/verses?tag=${encodeURIComponent(t)}`}
                className="rounded-full border border-input px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                {tagLabel(t)}
              </Link>
            ))}
          </div>
        )}

        {verse.notes && (
          <section className="mt-6 rounded-xl bg-muted/60 p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Notes</h2>
            <p className="mt-1 whitespace-pre-line">{verse.notes}</p>
          </section>
        )}
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
