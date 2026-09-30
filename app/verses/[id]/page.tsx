import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Palette } from "lucide-react";
import { z } from "zod";
import { CardShare } from "@/components/card-share";
import { TagChip } from "@/components/tag-chip";
import { CardBack, TextCard } from "@/components/verse-library";
import { AddNoteButton, VerseNotes } from "@/components/verse-notes";
import { Morph, morphName } from "@/components/verse-morph";
import { Screen } from "@/components/screen";
import { VerseMore } from "@/components/verse-more";
import { PracticeBar, PracticeButton, PracticeCard, PracticeProvider, PracticeReference, PracticeText } from "@/components/verse-practice";
import { SwipeTarget } from "@/components/card-swiper";
import { verseAction } from "@/components/verse-action";
import { Tour } from "@/components/tour";
import { VerseSwiper } from "@/components/verse-swiper";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { bookByName } from "@/lib/bible/books";
import { sharePath } from "@/lib/cards/share";
import { readCardStyle } from "@/lib/cards/style";
import { formatDate } from "@/lib/format";
import { getTimeZone } from "@/lib/day";
import { listNotes } from "@/lib/verses/notes";
import { mastery } from "@/lib/verses/mastery";
import { getVerse } from "@/lib/verses/queries";
import { StarButton } from "@/components/star-button";
import { setArchived, setStarred } from "../actions";

const MASTERY_NAME = { new: "Not practiced yet", learning: "Learning", mastered: "Mastered" } as const;

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
  // The reference side of the verse, for practising with Flip.
  const back = <CardBack v={{ reference: verse.reference, localReference: localRef, translation: verse.translation, card }} />;

  return (
    <Screen
      back={archived ? { href: "/verses?view=archived", label: "Archived" } : { href: "/verses", label: "My verses" }}
      action={
        // Editing, archiving and the verse's dates wait behind "⋯", out of the way until wanted.
        <div data-tour="verse-more" className="flex items-center gap-1">
          {!archived && <StarButton starred={verse.starredAt !== null} action={setStarred.bind(null, verse.id)} />}
          <VerseMore
            reference={localRef ?? verse.reference}
            editHref={archived ? null : `/verses/${verse.id}/edit`}
            archived={archived}
            details={`Added ${formatDate(verse.createdAt)}${archived ? "" : ` · ${MASTERY_NAME[mastery(verse.srs)]}`}`}
            archiveAction={setArchived.bind(null, verse.id, !archived)}
          />
        </div>
      }
    >
      <VerseSwiper id={verse.id}>
      <PracticeProvider>
      <article>
        {/* Above the verse, so they stay put while it's swiped to the next one. */}
        {!archived && (
          <div data-tour="verse-actions" className="mb-4 grid grid-cols-4 gap-1">
            <Link href={`/verses/${verse.id}/card`} transitionTypes={["nav-forward"]} className={verseAction()}>
              <Palette className="size-5" aria-hidden /> {card ? "Edit card" : "Card"}
            </Link>
            <CardShare
              verseId={verse.id}
              reference={localRef ?? verse.reference}
              translation={verse.translation}
              text={verse.text}
              card={card}
              initialPath={verse.shareToken ? sharePath(verse.shareToken) : null}
              initialVisibility={verse.visibility}
            />
            <AddNoteButton />
            <PracticeButton />
            <PracticeBar />
          </div>
        )}

        {card ? (
          <>
            <h1 className="sr-only">{verse.reference}</h1>
            {archived && <Badge variant="outline" className="mb-3">Archived</Badge>}
            {/* The verse as it looks in My verses, whole: the full card is in the card editor and when shared. */}
            <SwipeTarget tour="verse-card">
            <PracticeCard back={back}>
              <TextCard
                full
                practice
                v={{
                  id: verse.id,
                  reference: verse.reference,
                  localReference: localRef,
                  book: verse.book,
                  translation: verse.translation,
                  text: verse.text,
                  tags: [],
                  card,
                }}
              />
            </PracticeCard>
            </SwipeTarget>
          </>
        ) : (
          <SwipeTarget tour="verse-card">
          <PracticeCard back={back} plain>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{verse.translation}</Badge>
              {archived && <Badge variant="outline">Archived</Badge>}
            </div>
            <Morph name={morphName.reference(verse.id)}>
              <h1 className="mt-3 w-fit font-brand text-3xl font-semibold tracking-tight">
                <PracticeReference text={verse.reference} />
              </h1>
            </Morph>
            {localRef && (
              <p className="text-muted-foreground">
                <PracticeReference text={localRef} />
              </p>
            )}

            <Morph name={morphName.text(verse.id)}>
              <p className="mt-5 whitespace-pre-line font-serif text-[1.35rem] leading-relaxed">
                <PracticeText text={verse.text} />
              </p>
            </Morph>
          </PracticeCard>
          </SwipeTarget>
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
      </PracticeProvider>
      {!archived && <Tour id="verse" />}

      </VerseSwiper>
    </Screen>
  );
}
