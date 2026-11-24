import { describe, expect, it } from "@jest/globals";

import { STORIES } from "@/constants/stories";

describe("sample stories", () => {
  it("covers National, State and International, and names no district", () => {
    expect(STORIES.map((s) => s.category)).toEqual([
      "National",
      "State",
      "International",
    ]);
  });

  it("picks its topics from the seven", () => {
    expect(STORIES.map((s) => s.topic)).toEqual([
      "politics",
      "civic",
      "business",
    ]);
  });

  it("keeps each Summary within the 60-word limit so it fits the card", () => {
    for (const story of STORIES) {
      expect(story.body.split(/\s+/).length).toBeLessThanOrEqual(60);
    }
  });

  it("shows the tick on at most the one government source", () => {
    const ticked = STORIES.filter((s) => s.official);

    expect(ticked).toHaveLength(1);
    expect(ticked[0].source).toContain("Ministry");
  });

  it("never names Saransh as the source and has no time line", () => {
    for (const story of STORIES) {
      expect(story.source).not.toMatch(/saransh/i);
      expect(story.createdAt).toBeUndefined();
    }
  });

  it("has no article behind it, so the source line is plain text", () => {
    for (const story of STORIES) {
      expect(story.sourceUrl).toBeUndefined();
    }
  });
});
