"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finishGame, saveGameState } from "@/app/games/actions";
import type { DailyGame } from "@/lib/db/schema";

export type GameStatus = DailyGame["status"];

// Local game state that's saved after every move and finished exactly once.
export function useGame<S>(id: string, initialState: S, initialStatus: GameStatus) {
  const router = useRouter();
  const [state, setState] = useState<S>(initialState);
  const [status, setStatus] = useState<GameStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const finishing = useRef(false);

  function update(next: S) {
    setState(next);
    void saveGameState(id, next).catch(() => setError("Couldn't save your progress. Check your connection."));
  }

  async function finish(next: S) {
    setState(next);
    if (finishing.current) return;
    finishing.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await finishGame(id, next);
      if (!result.ok) throw new Error();
      setStatus(result.status);
      router.refresh();
    } catch {
      finishing.current = false;
      setError("Couldn't save the result. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return { state, status, update, finish, error, saving, playing: status === "in_progress" };
}
