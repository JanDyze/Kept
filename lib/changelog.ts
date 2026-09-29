import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pkg from "@/package.json";

// The app's version (package.json), bumped with each release, and its notes from CHANGELOG.md:
// "## 0.14.0 — Title" headings, each followed by "- " bullets. Read once per server.

export const APP_VERSION: string = pkg.version;

export type Release = { version: string; title: string; notes: string[] };

let releases: Promise<Release[]> | null = null;

export function parseChangelog(markdown: string): Release[] {
  const out: Release[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+(\d+\.\d+\.\d+)\s*(?:[—–-]\s*(.*))?$/.exec(line);
    if (heading) out.push({ version: heading[1], title: heading[2]?.trim() ?? "", notes: [] });
    else if (out.length && line.startsWith("- ")) out[out.length - 1].notes.push(line.slice(2).trim());
    else if (out.length && /^\s{2,}\S/.test(line) && out[out.length - 1].notes.length) {
      // a bullet wrapped onto the next line
      const notes = out[out.length - 1].notes;
      notes[notes.length - 1] += ` ${line.trim()}`;
    }
  }
  return out;
}

export function getReleases() {
  releases ??= readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8")
    .then(parseChangelog)
    .catch(() => {
      releases = null;
      return [];
    });
  return releases;
}

// Compares "0.13.0" and "0.14.0" as versions, not strings.
export function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

// The releases someone hasn't seen yet, newest first (all since their last one, at most three).
export async function unseenReleases(seen: string | null) {
  const all = await getReleases();
  if (!seen) return all.slice(0, 1);
  return all.filter((r) => compareVersions(r.version, seen) > 0).slice(0, 3);
}
