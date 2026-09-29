import "server-only";
import { galleryCards } from "./gallery";
import { getProfileByUsername } from "./profiles";

// Which list a card was opened from (?from=…), so its page can swipe to the cards either side in
// the same order: Discover's "all" or "friends", or one person's shared cards ("u:name").
export async function cardNeighbours(viewerId: string, from: string | undefined, cardId: string) {
  if (!from) return null;
  let list;
  if (from === "all" || from === "friends") list = await galleryCards(viewerId, { scope: from });
  else if (from.startsWith("u:")) {
    const person = await getProfileByUsername(from.slice(2));
    if (!person) return null;
    list = await galleryCards(viewerId, { authorId: person.userId });
  } else return null;

  const at = list.findIndex((c) => c.id === cardId);
  if (at < 0) return null;
  return { prev: list[at - 1]?.id ?? null, next: list[at + 1]?.id ?? null, index: at, total: list.length };
}
