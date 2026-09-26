"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { completeGame, saveProgress } from "@/lib/games/finish";

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
