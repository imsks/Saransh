import { describe, expect, it } from "vitest";

import { mapApiStoryToCarousel } from "./stories";

describe("mapApiStoryToCarousel", () => {
  it("maps API stories into carousel cards", () => {
    const story = mapApiStoryToCarousel({
      id: "story-1",
      title_en: "Parliament passes data bill",
      summary_en: "The Lok Sabha passed the bill by voice vote.",
      image_url: "https://example.com/cover.jpg",
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
    expect(story.imageUrl).toBe("https://example.com/cover.jpg");
  });

  it("leaves imageUrl undefined when the API sends an empty image_url", () => {
    const story = mapApiStoryToCarousel({
      id: "story-2",
      title_en: "Some story",
      summary_en: "Body.",
      image_url: "",
      category: "State",
      state: "Bihar",
      district: null,
      status: "published",
      sources: [{ outlet: "PTI", url: "https://example.com/2" }],
      created_at: new Date().toISOString(),
    });

    expect(story.imageUrl).toBeUndefined();
  });
});
