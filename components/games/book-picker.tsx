"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { BOOKS, type Book } from "@/lib/bible/books";
import { cn } from "@/lib/utils";

// "1 Cor", "1cor", "1 corinto" and "corinth" all find 1 Corinthians.
const squash = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

function matches(book: Book, q: string) {
  if (!q) return true;
  return [book.name, book.tl].some((n) => squash(n).includes(q));
}

// The Reference game's book choice: a button that opens a sheet of all 66 books, Old and New
// Testament, with a search on top. Tagalog names show beside the English ones.
export function BookPicker({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (bookNumber: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? BOOKS[value - 1] : null;
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3 text-left text-base transition-colors hover:bg-muted/50 disabled:opacity-60",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selected ? selected.name : "Book"}
          {selected && selected.tl !== selected.name && <span className="text-muted-foreground"> · {selected.tl}</span>}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {open &&
        createPortal(
          <BookSheet
            value={value}
            onClose={() => setOpen(false)}
            onPick={(n) => {
              onChange(n);
              setOpen(false);
            }}
          />,
          document.body,
        )}
    </>
  );
}

function BookSheet({ value, onPick, onClose }: { value: number | null; onPick: (n: number) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = squash(query);
  const found = useMemo(() => BOOKS.filter((b) => matches(b, q)), [q]);
  const groups = [
    { title: "Old Testament", books: found.filter((b) => b.number <= 39) },
    { title: "New Testament", books: found.filter((b) => b.number > 39) },
  ].filter((g) => g.books.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // The selected book scrolls into view when the sheet opens.
  useEffect(() => {
    if (value) document.getElementById(`book-${value}`)?.scrollIntoView({ block: "center" });
  }, [value]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Choose a book">
      <button type="button" aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div className="animate-rise relative mx-auto flex h-[82dvh] w-full max-w-xl flex-col rounded-t-3xl border-t bg-background shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)]">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books"
              aria-label="Search books"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              onKeyDown={(e) => {
                if (e.key === "Enter" && found.length > 0) {
                  e.preventDefault();
                  onPick(found[0].number);
                }
              }}
              className="h-11 w-full rounded-xl border border-input bg-card pr-3 pl-9 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {groups.length === 0 && <p className="py-10 text-center text-muted-foreground">No book matches.</p>}
          {groups.map((g) => (
            <section key={g.title} aria-label={g.title} className="mb-4">
              <h3 className="sticky top-0 z-10 bg-background py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {g.title}
              </h3>
              <ul className="grid grid-cols-2 gap-1.5">
                {g.books.map((b) => (
                  <li key={b.number}>
                    <button
                      type="button"
                      id={`book-${b.number}`}
                      onClick={() => onPick(b.number)}
                      aria-pressed={b.number === value}
                      className={cn(
                        "flex h-12 w-full items-center justify-between gap-1 rounded-xl border px-3 text-left transition-colors",
                        b.number === value ? "border-primary bg-primary/8" : "bg-card hover:bg-muted/60",
                      )}
                    >
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-medium">{b.name}</span>
                        {b.tl !== b.name && <span className="block truncate text-xs text-muted-foreground">{b.tl}</span>}
                      </span>
                      {b.number === value && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
