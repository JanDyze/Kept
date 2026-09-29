import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FillBlanksGame } from "@/components/games/fill-blanks";
import { FirstLettersGame } from "@/components/games/first-letters";
import { MatchUpGame } from "@/components/games/match-up";
import { HowToPlay } from "@/components/games/how-to-play";
import { MissingWordGame } from "@/components/games/missing-word";
import { ReferenceWordleGame } from "@/components/games/reference-wordle";
import { SayItGame, TypeItGame } from "@/components/games/recite";
import { Replayable } from "@/components/games/replay";
import { SpotChangeGame } from "@/components/games/spot-change";
import { TwoTonguesGame } from "@/components/games/two-tongues";
import { UnscrambleGame } from "@/components/games/unscramble";
import { Screen } from "@/components/screen";
import { StarButton } from "@/components/star-button";
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
import type { RecitePuzzle, ReciteState } from "@/lib/games/recite";
import type { ReferenceWordlePuzzle, ReferenceWordleState } from "@/lib/games/reference-wordle";
import { gameById, gameBySlug } from "@/lib/games/registry";
import { starredFirst, starredGames } from "@/lib/games/stars";
import type { SpotChangePuzzle, SpotChangeState } from "@/lib/games/spot-change";
import type { TwoTonguesPuzzle, TwoTonguesState } from "@/lib/games/two-tongues";
import type { UnscramblePuzzle, UnscrambleState } from "@/lib/games/unscramble";
import { setGameStarred } from "../actions";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: gameBySlug(slug)?.name };
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const info = gameBySlug(slug);
  if (!info) notFound();

  const user = await requireUser();
  const [day, starred] = await Promise.all([getOrCreateDay(user.id, await today()), starredGames(user.id)]);
  const games = starredFirst(day, (g) => g.game, starred); // the Games page's order
  const game = games.find((g) => g.game === info.id);
  const action = (
    <div className="flex items-center gap-1">
      <StarButton starred={starred.includes(info.id)} action={setGameStarred.bind(null, info.id)} />
      <HowToPlay info={info} />
    </div>
  );

  if (info.underDevelopment) {
    return (
      <Screen back={{ href: "/games", label: "Games" }} title={info.name} action={action}>
        <p className="text-muted-foreground">{info.name} is under development. It will be back soon.</p>
      </Screen>
    );
  }

  if (!game) {
    return (
      <Screen back={{ href: "/games", label: "Games" }} title={info.name} action={action}>
        <p className="text-muted-foreground">
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
      case "type_it":
        return <TypeItGame {...common} puzzle={puzzle as RecitePuzzle} initialState={state as ReciteState} />;
      case "say_it":
        return <SayItGame {...common} puzzle={puzzle as RecitePuzzle} initialState={state as ReciteState} />;
    }
  };

  return (
    <Screen back={{ href: "/games", label: "Games" }} title={info.name} action={action} className="pb-0">
      {/* The game's own hue, for its result marks. */}
      <div className="game-tint contents" style={{ "--game-hue": info.hue } as React.CSSProperties}>
        <Replayable game={game.game} puzzle={game.puzzle} fresh={render({}, "in_progress")}>
          {render(game.state, game.status)}
        </Replayable>
      </div>
    </Screen>
  );
}
