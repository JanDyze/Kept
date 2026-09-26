import { describe, expect, it } from "vitest";
import { matchTopics, rankVerses, translateQuery } from "./topics";

const TOPICS = [
  "depression",
  "being depressed",
  "depressed",
  "anxiety and depression",
  "adolescent depression",
  "antidepressants",
  "birthday",
  "birthdays",
  "celebrating birthdays",
  "birth control",
  "mothers",
  "mother",
  "mother in law",
  "fathers",
  "new job",
  "jobs",
  "job",
].map((topic, i) => ({ topic, votes: 1000 - i * 10 }));

const names = (q: string) => matchTopics(q, TOPICS).map((m) => m.topic);

describe("matchTopics", () => {
  it("finds the topic and its word forms", () => {
    const hits = names("depression");
    expect(hits[0]).toBe("depression");
    expect(hits).toContain("depressed");
    expect(hits).toContain("being depressed");
    expect(hits).not.toContain("antidepressants");
  });

  it("matches singular and plural", () => {
    expect(names("birthdays").slice(0, 2).sort()).toEqual(["birthday", "birthdays"]);
    expect(names("birthday")).not.toContain("birth control");
    expect(names("mom")).toEqual([]);
    expect(names("mother").slice(0, 2).sort()).toEqual(["mother", "mothers"]);
  });

  it("handles multi-word searches", () => {
    expect(names("new job")[0]).toBe("new job");
  });

  it("understands Tagalog search words", () => {
    expect(translateQuery("Kaarawan")).toBe("birthday");
    expect(translateQuery("nanay")).toBe("mothers");
    expect(names("kaarawan")).toContain("birthday");
    expect(names("depresyon")[0]).toBe("depression");
  });
});

describe("rankVerses", () => {
  it("blends topics and boosts verses that appear in several", () => {
    const matches = [
      { topic: "depression", score: 1 },
      { topic: "depressed", score: 0.5 },
    ];
    const rows = [
      { topic: "depression", bookNumber: 19, chapter: 34, verseStart: 17, verseEnd: 18, votes: 2000 },
      { topic: "depression", bookNumber: 23, chapter: 41, verseStart: 10, verseEnd: null, votes: 1500 },
      { topic: "depressed", bookNumber: 23, chapter: 41, verseStart: 10, verseEnd: null, votes: 90 },
      { topic: "depressed", bookNumber: 60, chapter: 5, verseStart: 7, verseEnd: null, votes: 100 },
    ];
    const ranked = rankVerses(matches, rows);
    expect(ranked[0]).toMatchObject({ bookNumber: 23, chapter: 41, topics: ["depression", "depressed"] });
    expect(ranked).toHaveLength(3);
  });

  it("merges ranges that start on the same verse", () => {
    const matches = [{ topic: "mothers", score: 1 }];
    const rows = [
      { topic: "mothers", bookNumber: 20, chapter: 31, verseStart: 25, verseEnd: 30, votes: 1687 },
      { topic: "mothers", bookNumber: 20, chapter: 31, verseStart: 25, verseEnd: 31, votes: 400 },
      { topic: "mothers", bookNumber: 20, chapter: 22, verseStart: 6, verseEnd: null, votes: 1072 },
    ];
    const ranked = rankVerses(matches, rows);
    expect(ranked).toHaveLength(2);
    expect(ranked[0]).toMatchObject({ chapter: 31, verseStart: 25, verseEnd: 30 });
    expect(ranked[0]).not.toHaveProperty("best");
  });
});
