// Short guided tours of the things that aren't obvious on a first look: a spotlight on one part
// of the screen at a time, with Skip, Next and Got it (components/tour.tsx). Each shows once per
// device; Settings → Tips shows any of them again. Steps point at elements marked
// data-tour="<target>"; a step whose element isn't on screen (an empty list, a guest) is skipped.

export type TourStep = { target: string; title: string; body: string };
export type TourId = "home" | "verses" | "verse" | "bible" | "discover" | "card";
export type TourInfo = {
  id: TourId;
  name: string; // in Settings
  where: string; // where it shows, in Settings
  href?: string; // a page to open to see it again now; detail pages have none
  steps: TourStep[];
};

export const TOURS: Record<TourId, TourInfo> = {
  home: {
    id: "home",
    name: "Getting started",
    where: "Home",
    href: "/",
    steps: [
      { target: "home-add", title: "Add a verse", body: "Type a reference like “John 3:16”, and Kept fills in the words. Every verse you add turns into daily games." },
      { target: "home-sections", title: "Four places", body: "Games are made from your verses. My verses is everything you've kept. Read the Bible, or Discover what others keep." },
      { target: "home-you", title: "You", body: "Your streak and today's games. Tap for your profile, friends and settings." },
    ],
  },
  verses: {
    id: "verses",
    name: "My verses",
    where: "My verses",
    href: "/verses",
    steps: [
      { target: "verses-add", title: "Add more", body: "Add a verse any time from here." },
      { target: "verses-find", title: "Find and sort", body: "Search your verses, or sort them by Bible book, most recent, or your own order." },
      { target: "verses-list", title: "Open one", body: "Tap a verse to open it. There, swipe left or right to go through them all." },
    ],
  },
  verse: {
    id: "verse",
    name: "A verse",
    where: "A verse's page",
    steps: [
      { target: "verse-card", title: "Swipe", body: "Swipe the page left or right for your next or previous verse, in the order of your list." },
      { target: "verse-actions", title: "Make it yours", body: "Turn it into a card, share it, or write a note on what it means to you today." },
      { target: "verse-practice", title: "Practice", body: "Cover the words, flip it to the reference, or cover the reference. It stays on as you swipe." },
      { target: "verse-more", title: "More", body: "Star it, edit it, or archive it when you've learned it." },
    ],
  },
  bible: {
    id: "bible",
    name: "Reading the Bible",
    where: "A Bible chapter",
    steps: [
      { target: "bible-verse", title: "Keep from the Bible", body: "Tap a verse to select it, tap another to make it a range, then tap Keep to save it." },
    ],
  },
  discover: {
    id: "discover",
    name: "Discover",
    where: "Discover",
    href: "/search",
    steps: [
      { target: "discover-search", title: "Search", body: "Search a feeling, an occasion, or words you remember, like “anxiety” or “new job”." },
      { target: "discover-tabs", title: "Cards and verses", body: "Cards people share, or the verses people keep most. Tap Keep on one to save it to My verses." },
      { target: "discover-friends", title: "Friends", body: "Add friends to see the cards they share with friends only." },
    ],
  },
  card: {
    id: "card",
    name: "A shared card",
    where: "A card from Discover",
    steps: [
      { target: "card-card", title: "Swipe", body: "Swipe left or right for the next card." },
      { target: "card-like", title: "Like", body: "Like a card to show it helped; liked cards rise in Discover." },
      { target: "card-keep", title: "Keep it", body: "Keep the verse, with its card, in your own verses." },
    ],
  },
};

const KEY = "kept:tours-seen";

export function seenTours(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function markTour(id: TourId, seen: boolean) {
  const all = seenTours();
  if (seen) all.add(id);
  else all.delete(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...all]));
  } catch {}
}
