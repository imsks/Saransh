import { afterEach, describe, expect, it, vi } from "vitest";

import { STORIES } from "@/constants/stories";
import StoryCarousel from "@/components/stories/StoryCarousel";

afterEach(() => {
  vi.unstubAllGlobals();
});

function apiStory(id: string) {
  return {
    id,
    title_en: "Live headline",
    summary_en: "Live summary.",
    image_url: "https://example.com/cover.jpg",
    source_url: "https://example.com/story",
    category: "National",
    state: null,
    district: null,
    status: "published",
    sources: [{ outlet: "PTI", url: "https://example.com/story" }],
    created_at: new Date().toISOString(),
  };
}

describe("StoryCarousel", () => {
  it("falls back to the labelled samples when the API has no stories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );

    const carousel = await StoryCarousel();

    expect(carousel.props.stories).toBe(STORIES);
    expect(carousel.props.isSample).toBe(true);
  });

  it("shows live stories without the sample label", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [apiStory("1")] }),
    );

    const carousel = await StoryCarousel();

    expect(carousel.props.stories).toHaveLength(1);
    expect(carousel.props.stories[0].headline).toBe("Live headline");
    expect(carousel.props.isSample).toBe(false);
  });
});
