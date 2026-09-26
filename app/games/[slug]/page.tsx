import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FillBlanksGame } from "@/components/games/fill-blanks";
import { FirstLettersGame } from "@/components/games/first-letters";
import { MatchUpGame } from "@/components/games/match-up";
import { MissingWordGame } from "@/components/games/missing-word";
import { ReferenceWordleGame } from "@/components/games/reference-wordle";
import { SpotChangeGame } from "@/components/games/spot-change";
import { TwoTonguesGame } from "@/components/games/two-tongues";
import { UnscrambleGame } from "@/components/games/unscramble";
import { Screen } from "@/components/screen";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { wordsOfLength } from "@/lib/bible/vocab";
import { today } from "@/lib/day";
import type { FillBlanksPuzzle, FillBlanksState } from "@/lib/games/fill-blanks";
import { getOrCreateDay } from "@/lib/games/daily";
import type { FirstLettersPuzzle, FirstLettersState } from "@/lib/games/first-letters";
import type { MatchUpPuzzle, MatchUpState } from "@/lib/games/match-up";
import type { MissingWordPuzzle, MissingWordState } from "@/lib/games/missing-word";
import type { ReferenceWordlePuzzle, ReferenceWordleState } from "@/lib/games/reference-wordle";
import { gameById, gameBySlug } from "@/lib/games/registry";
import type { SpotChangePuzzle, SpotChangeState } from "@/lib/games/spot-change";
import type { TwoTonguesPuzzle, TwoTonguesState } from "@/lib/games/two-tongues";
import type { UnscramblePuzzle, UnscrambleState } from "@/lib/games/unscramble";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: gameBySlug(slug)?.name };
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const info = gameBySlug(slug);
  if (!info) notFound();

  const user = await requireUser();
  const games = await getOrCreateDay(user.id, await today());
  const game = games.find((g) => g.game === info.id);

  if (!game) {
    return (
      <Screen back={{ href: "/games", label: "Games" }}>
        <h1 className="font-brand text-3xl font-semibold tracking-tight">{info.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {games.length === 0
            ? "Games are made from your saved verses. Add one to start."
            : "None of your verses fit this game today. Longer verses work best."}
        </p>
        <Link href="/verses/new" transitionTypes={["nav-forward"]} className={buttonVariants({ className: "mt-5 h-11 w-fit px-5" })}>
          Add a verse
        </Link>
      </Screen>
    );
  }

  // Suggest the next unfinished game after this one ends.
  const after = [...games.slice(games.indexOf(game) + 1), ...games.slice(0, games.indexOf(game))].find(
    (g) => g.status === "in_progress",
  );
  const next = after ? { href: `/games/${gameById(after.game).slug}`, name: gameById(after.game).name } : undefined;
  const common = { id: game.id, initialStatus: game.status, next };

  let body: React.ReactNode;
  switch (game.game) {
    case "missing_word": {
      const puzzle = game.puzzle as MissingWordPuzzle;
      const dictionary = await wordsOfLength(puzzle.translation, puzzle.answer.length, puzzle.answer);
      body = (
        <MissingWordGame {...common} puzzle={puzzle} initialState={game.state as MissingWordState} dictionary={dictionary} />
      );
      break;
    }
    case "reference_wordle":
      body = (
        <ReferenceWordleGame
          {...common}
          puzzle={game.puzzle as ReferenceWordlePuzzle}
          initialState={game.state as ReferenceWordleState}
        />
      );
      break;
    case "fill_blanks":
      body = <FillBlanksGame {...common} puzzle={game.puzzle as FillBlanksPuzzle} initialState={game.state as FillBlanksState} />;
      break;
    case "unscramble":
      body = <UnscrambleGame {...common} puzzle={game.puzzle as UnscramblePuzzle} initialState={game.state as UnscrambleState} />;
      break;
    case "first_letters":
      body = <FirstLettersGame {...common} puzzle={game.puzzle as FirstLettersPuzzle} initialState={game.state as FirstLettersState} />;
      break;
    case "spot_change":
      body = <SpotChangeGame {...common} puzzle={game.puzzle as SpotChangePuzzle} initialState={game.state as SpotChangeState} />;
      break;
    case "match_up":
      body = <MatchUpGame {...common} puzzle={game.puzzle as MatchUpPuzzle} initialState={game.state as MatchUpState} />;
      break;
    case "two_tongues":
      body = <TwoTonguesGame {...common} puzzle={game.puzzle as TwoTonguesPuzzle} initialState={game.state as TwoTonguesState} />;
      break;
  }

  return <Screen back={{ href: "/games", label: "Games" }}>{body}</Screen>;
}
