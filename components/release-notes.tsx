import { Fragment } from "react";

// A changelog bullet, with its `code` and **bold** set; everything else is plain text.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 py-px font-mono text-[0.85em]">
            {p.slice(1, -1)}
          </code>
        ) : p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function ReleaseNotes({ notes, className }: { notes: string[]; className?: string }) {
  return (
    <ul className={className ?? "flex flex-col gap-2.5"}>
      {notes.map((n, i) => (
        <li key={i} className="flex gap-2.5 text-[0.95rem] leading-relaxed">
          <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-icon-accent" aria-hidden />
          <span className="min-w-0">
            <Inline text={n} />
          </span>
        </li>
      ))}
    </ul>
  );
}
