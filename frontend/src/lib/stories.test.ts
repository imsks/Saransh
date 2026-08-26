import { describe, expect, it } from "vitest";

import { mapApiStoryToCarousel } from "./stories";

describe("mapApiStoryToCarousel", () => {
  it("maps API stories into carousel cards", () => {
    const story = mapApiStoryToCarousel({
      id: "story-1",
      title_en: "Parliament passes data bill",
      summary_en: "The Lok Sabha passed the bill by voice vote.",
      category: "National",
      state: "Parliament",
      district: null,
      status: "published",
      sources: [{ outlet: "PTI", url: "https://example.com/story" }],
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });

    expect(story.headline).toBe("Parliament passes data bill");
    expect(story.body).toContain("Lok Sabha");
    expect(story.category).toBe("National · Parliament");
    expect(story.source).toBe("PTI · Verified");
    expect(story.imageVariant).toBe("national");
  });
});
