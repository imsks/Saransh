import { describe, expect, it } from "vitest";

import { STORIES } from "@/constants/stories";

describe("sample stories", () => {
  it("covers National, State and International, and names no district", () => {
    expect(STORIES.map((s) => s.category)).toEqual(["National", "State", "International"]);
  });

  it("picks its topics from the seven", () => {
    expect(STORIES.map((s) => s.topic)).toEqual(["politics", "civic", "business"]);
  });

  it("keeps each English body to 60 words or fewer", () => {
    for (const story of STORIES) {
      expect(story.body.split(/\s+/).length).toBeLessThanOrEqual(60);
    }
  });

  it("shows the tick on at most the one government source", () => {
    const ticked = STORIES.filter((s) => s.official);

    expect(ticked).toHaveLength(1);
    expect(ticked[0].source).toContain("Ministry");
  });

  it("credits an illustration or an official photo, never a publisher", () => {
    for (const story of STORIES) {
      const credit = story.credit;
      expect(credit === "Illustration · Saransh" || /^Photo: .+ \(official\)$/.test(credit)).toBe(
        true,
      );
    }
  });

  it("has no article behind it, so Read story stays inert", () => {
    for (const story of STORIES) {
      expect(story.sourceUrl).toBeUndefined();
    }
  });
});
