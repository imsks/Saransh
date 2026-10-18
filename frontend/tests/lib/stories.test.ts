import { describe, expect, it } from "@jest/globals";

import type { ApiStory } from "@/lib/stories";
import { mapApiStoryToCarousel, topicFor } from "@/lib/stories";

function apiStory(overrides: Partial<ApiStory> = {}): ApiStory {
  return {
    id: "story-1",
    title_en: "Parliament passes data bill",
    summary_en: "The Lok Sabha passed the bill by voice vote.",
    image_url: "https://example.com/cover.jpg",
    source_url: "https://example.com/canonical",
    source_label: "PTI",
    category: "National",
    state: "Parliament",
    status: "published",
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
    expect(story.credit).toBe("PTI");
    expect(story.sourceUrl).toBe("https://example.com/canonical");
    expect(story.official).toBeUndefined();
    expect(story.topic).toBe("civic");
    expect(story.imageUrl).toBe("https://example.com/cover.jpg");
  });

  it("leaves imageUrl undefined when the API sends an empty image_url", () => {
    const story = mapApiStoryToCarousel(
      apiStory({ image_url: "", category: "State", state: "Bihar" }),
    );

    expect(story.imageUrl).toBeUndefined();
  });

  it("credits Saransh and renders no dead link when citation fields are empty", () => {
    const story = mapApiStoryToCarousel(
      apiStory({ source_url: "", source_label: null }),
    );

    expect(story.sourceUrl).toBeUndefined();
    expect(story.source).toBe("Saransh");
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
