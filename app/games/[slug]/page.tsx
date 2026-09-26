import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FillBlanksGame } from "@/components/games/fill-blanks";
import { FirstLettersGame } from "@/components/games/first-letters";
import { MatchUpGame } from "@/components/games/match-up";
import { MissingWordGame } from "@/components/games/missing-word";
import { ReferenceWordleGame } from "@/components/games/reference-wordle";
import { Replayable } from "@/components/games/replay";
import { SpotChangeGame } from "@/components/games/spot-change";
import { TwoTonguesGame } from "@/components/games/two-tongues";
import { UnscrambleGame } from "@/components/games/unscramble";
import { Screen } from "@/components/screen";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { wordsOfLength } from "@/lib/bible/vocab";
import type { DailyGame } from "@/lib/db/schema";
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
  let dictionary: string[] = [];
  if (game.game === "missing_word") {
    const { translation, answer } = game.puzzle as MissingWordPuzzle;
    dictionary = await wordsOfLength(translation, answer.length, answer);
  }

  // The game from a given state: today's (saved) one, and a blank one for practice replays.
  const render = (state: unknown, status: DailyGame["status"]): React.ReactElement => {
    const common = { id: game.id, initialStatus: status, next };
    const puzzle = game.puzzle;
    switch (game.game) {
      case "missing_word":
        return (
          <MissingWordGame
            {...common}
            puzzle={puzzle as MissingWordPuzzle}
            initialState={state as MissingWordState}
            dictionary={dictionary}
          />
        );
      case "reference_wordle":
        return (
          <ReferenceWordleGame {...common} puzzle={puzzle as ReferenceWordlePuzzle} initialState={state as ReferenceWordleState} />
        );
      case "fill_blanks":
        return <FillBlanksGame {...common} puzzle={puzzle as FillBlanksPuzzle} initialState={state as FillBlanksState} />;
      case "unscramble":
        return <UnscrambleGame {...common} puzzle={puzzle as UnscramblePuzzle} initialState={state as UnscrambleState} />;
      case "first_letters":
        return <FirstLettersGame {...common} puzzle={puzzle as FirstLettersPuzzle} initialState={state as FirstLettersState} />;
      case "spot_change":
        return <SpotChangeGame {...common} puzzle={puzzle as SpotChangePuzzle} initialState={state as SpotChangeState} />;
      case "match_up":
        return <MatchUpGame {...common} puzzle={puzzle as MatchUpPuzzle} initialState={state as MatchUpState} />;
      case "two_tongues":
        return <TwoTonguesGame {...common} puzzle={puzzle as TwoTonguesPuzzle} initialState={state as TwoTonguesState} />;
    }
  };

  return (
    <Screen back={{ href: "/games", label: "Games" }}>
      <Replayable game={game.game} puzzle={game.puzzle} fresh={render({}, "in_progress")}>
        {render(game.state, game.status)}
      </Replayable>
    </Screen>
  );
}
