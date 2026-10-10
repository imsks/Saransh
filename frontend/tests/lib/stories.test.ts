import { describe, expect, it } from "vitest";

import type { ApiStory } from "@/lib/stories";
import { mapApiStoryToCarousel, topicFor } from "@/lib/stories";

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
    expect(story.source).toBe("PTI");
    expect(story.official).toBeUndefined();
    expect(story.topic).toBe("civic");
    expect(story.imageUrl).toBe("https://example.com/cover.jpg");
  });

  it.each([
    [0, "Just now"],
    [65_000, "Just now"],
    [59 * 60 * 1000, "Just now"],
    [60 * 60 * 1000, "1 hr ago"],
    [10.5 * 60 * 60 * 1000, "10 hrs ago"],
    [12 * 60 * 60 * 1000, "12 hrs ago"],
    [200 * 60 * 60 * 1000, "12 hrs ago"],
    [-60 * 60 * 1000, "Just now"],
  ])("formats a story created %i ms ago as %s", (ageMs, expected) => {
    const story = mapApiStoryToCarousel(
      apiStory({ created_at: new Date(Date.now() - ageMs).toISOString() }),
    );

    expect(story.time).toBe(expected);
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
    expect(story.source).toBe("Source A");
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
    const story = mapApiStoryToCarousel(
      apiStory({ source_url: null, sources: [] }),
    );

    expect(story.sourceUrl).toBeUndefined();
    expect(story.source).toBe("Saransh");
  });

  it("ignores an empty source_url rather than rendering a dead link", () => {
    const story = mapApiStoryToCarousel(
      apiStory({ source_url: "", sources: [] }),
    );

    expect(story.sourceUrl).toBeUndefined();
  });
});

describe("topicFor", () => {
  it("matches an exact topic key", () => {
    expect(topicFor("politics")).toBe("politics");
    expect(topicFor("civic")).toBe("civic");
    expect(topicFor("education")).toBe("education");
    expect(topicFor("crime")).toBe("crime");
    expect(topicFor("business")).toBe("business");
    expect(topicFor("entertainment")).toBe("entertainment");
    expect(topicFor("sports")).toBe("sports");
  });

  it("matches an exact topic key whatever the casing", () => {
    expect(topicFor("Politics")).toBe("politics");
    expect(topicFor("ENTERTAINMENT")).toBe("entertainment");
  });

  it("falls back to a keyword in a free-text category", () => {
    expect(topicFor("Lok Sabha Election 2026")).toBe("politics");
    expect(topicFor("School exams")).toBe("education");
    expect(topicFor("Police investigation")).toBe("crime");
    expect(topicFor("Markets and trade")).toBe("business");
    expect(topicFor("Bollywood film release")).toBe("entertainment");
    expect(topicFor("Cricket")).toBe("sports");
    expect(topicFor("Road Infrastructure")).toBe("civic");
  });

  it("falls back to civic for anything it does not recognise", () => {
    expect(topicFor("National")).toBe("civic");
    expect(topicFor("")).toBe("civic");
  });
});
