"use client";

import { createContext, Fragment, useContext, useState, type ReactNode } from "react";
import { gameOutcome, type Outcome } from "@/lib/games/outcome";
import type { GameId } from "@/lib/games/registry";

type Replay = {
  /** A replay after today's result is in: judged here, saved nowhere. */
  practice: boolean;
  judge(state: unknown): Outcome | null;
  replay(): void;
};

const ReplayContext = createContext<Replay | null>(null);

export const useReplay = () => useContext(ReplayContext);

// Lets a finished game be played again. Each replay mounts `fresh` (the same game from a blank
// state) as a practice round: today's result, the streak and review schedules stay as first recorded.
export function Replayable({
  game,
  puzzle,
  fresh,
  children,
}: {
  game: GameId;
  puzzle: unknown;
  fresh: ReactNode;
  children: ReactNode;
}) {
  const [round, setRound] = useState(0);
  const value: Replay = {
    practice: round > 0,
    judge: (state) => gameOutcome(game, puzzle, state),
    replay: () => {
      setRound((r) => r + 1);
      window.scrollTo({ top: 0 });
    },
  };
  return (
    <ReplayContext value={value}>
      {round === 0 ? children : <Fragment key={round}>{fresh}</Fragment>}
    </ReplayContext>
  );
}
