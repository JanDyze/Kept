"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isEnglishWord } from "@/lib/games/dictionary";
import { completeGame, saveProgress } from "@/lib/games/finish";
import { setGameStar } from "@/lib/games/stars";

export async function saveGameState(id: string, state: unknown) {
  const user = await requireUser();
  await saveProgress(user.id, id, state);
}

export async function finishGame(id: string, state: unknown) {
  const user = await requireUser();
  const result = await completeGame(user.id, id, state);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

// A Missing Word guess that isn't in the verse's Bible text can still be any English word.
export async function checkWord(word: string) {
  await requireUser();
  return typeof word === "string" && word.length <= 12 && isEnglishWord(word);
}

// Stars a game (listed first on the Games page) or takes the star off.
export async function setGameStarred(game: string, starred: boolean) {
  const user = await requireUser();
  if (!(await setGameStar(user.id, game, starred))) return { error: "This game can't be found." };
  revalidatePath("/games", "layout");
  return {};
}
