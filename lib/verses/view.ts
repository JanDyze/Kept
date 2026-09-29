// My verses order: newest first (the default), Bible order grouped by book, or the user's own
// arrangement ("mine").
export type LibrarySort = "recent" | "book" | "mine";
export const LIBRARY_SORTS: { value: LibrarySort; label: string }[] = [
  { value: "mine", label: "My order" },
  { value: "recent", label: "Recent" },
  { value: "book", label: "Book" },
];
export const SORT_COOKIE = "kept-verses-sort";

// Set when a new user (or guest) skips adding their first verse: Home stops opening Add verse.
export const SKIP_FIRST_VERSE_COOKIE = "kept-skip-first-verse";
