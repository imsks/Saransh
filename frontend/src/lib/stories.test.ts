import { describe, expect, it } from "vitest";

import type { ApiStory } from "./stories";
import { mapApiStoryToCarousel } from "./stories";

function apiStory(overrides: Partial<ApiStory> = {}): ApiStory {
  return {
    id: "story-1",
    title_en: "Parliament passes data bill",
    summary_en: "The Lok Sabha passed the bill by voice vote.",
    image_url: "https://example.com/cover.jpg",
    source_url: "https://example.com/canonical",
    category: "National",
    state: "Parliament",
    district: null,
    status: "published",
    sources: [{ outlet: "PTI", url: "https://example.com/story" }],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe("mapApiStoryToCarousel", () => {
  it("maps API stories into carousel cards", () => {
    const story = mapApiStoryToCarousel(apiStory());

    expect(story.headline).toBe("Parliament passes data bill");
    expect(story.body).toContain("Lok Sabha");
    expect(story.category).toBe("National · Parliament");
    expect(story.source).toBe("PTI · Verified");
    expect(story.imageVariant).toBe("national");
    expect(story.imageUrl).toBe("https://example.com/cover.jpg");
  });

  it("leaves imageUrl undefined when the API sends an empty image_url", () => {
    const story = mapApiStoryToCarousel(
      apiStory({ image_url: "", category: "State", state: "Bihar" }),
    );

    expect(story.imageUrl).toBeUndefined();
  });

  it("uses source_url as the citation link, not the first source", () => {
    const story = mapApiStoryToCarousel(
      apiStory({
        source_url: "https://example.com/canonical",
        sources: [
          { outlet: "Source A", url: "https://source-a.com/1" },
          { outlet: "Source B", url: "https://source-b.com/2" },
        ],
      }),
    );

    expect(story.sourceUrl).toBe("https://example.com/canonical");
    expect(story.source).toBe("Source A · Verified");
  });

  it("falls back to the first source when source_url is null", () => {
    const story = mapApiStoryToCarousel(apiStory({ source_url: null }));

    expect(story.sourceUrl).toBe("https://example.com/story");
  });

  it("falls back to the first source when source_url is absent", () => {
    const withoutSourceUrl = { ...apiStory() };
    delete withoutSourceUrl.source_url;
    const story = mapApiStoryToCarousel(withoutSourceUrl);

    expect(story.sourceUrl).toBe("https://example.com/story");
  });

  it("leaves sourceUrl undefined when the story has no link at all", () => {
    const story = mapApiStoryToCarousel(apiStory({ source_url: null, sources: [] }));

    expect(story.sourceUrl).toBeUndefined();
    expect(story.source).toBe("Saransh");
  });

  it("ignores an empty source_url rather than rendering a dead link", () => {
    const story = mapApiStoryToCarousel(apiStory({ source_url: "", sources: [] }));

    expect(story.sourceUrl).toBeUndefined();
  });
});
